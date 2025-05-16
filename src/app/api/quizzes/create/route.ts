import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { AIService, QuizRequest } from '@/lib/ai-service';
import connectDB from '@/lib/db';
import { Quiz, createQuiz } from '@/lib/models/quiz';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { ObjectId } from 'mongodb';
import { z } from 'zod';
import { getUserByEmail } from '@/lib/models/user';
import { uploadImage } from '@/lib/db/gridfs';

const aiService = new AIService();

const CreateQuizRequestSchema = z.object({
    prompt: z.string().min(1, "Prompt is required"),
    difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
    numQuestions: z.number().min(1).max(20).default(5)
});

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { prompt, difficulty, numQuestions } = CreateQuizRequestSchema.parse(body);

        // Connect to database first to get user
        await connectDB();
        const user = await getUserByEmail(session.user.email);
        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        const quizRequest: QuizRequest = {
            topic: prompt,
            difficulty,
            numQuestions
        };

        const generatedQuiz = await aiService.generateQuiz(quizRequest);

        const imageResponse = await fetch(generatedQuiz.imageUrl);
        if (!imageResponse.ok) {
            throw new Error('Failed to fetch quiz image');
        }
        const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
        const imageId = await uploadImage(imageBuffer, `quiz-${Date.now()}.jpg`);

        const quizData = {
            title: generatedQuiz.topic,
            description: `A ${difficulty} difficulty quiz about ${generatedQuiz.topic}`,
            questions: generatedQuiz.questions.map((q, index) => ({
                id: index + 1,
                text: q.text,
                options: q.options,
                correctAnswer: q.correctAnswer,
                explanation: q.explanation
            })),
            createdBy: new ObjectId(user._id),
            metadata: {
                difficulty: generatedQuiz.metadata.difficulty,
                generatedAt: generatedQuiz.metadata.generatedAt,
                modelUsed: generatedQuiz.metadata.modelUsed,
                seed: generatedQuiz.metadata.seed
            },
            imageId: imageId
        };

        const quizId = await createQuiz(quizData);
        const savedQuiz = await Quiz.findById(quizId);

        if (!savedQuiz) {
            throw new Error('Failed to retrieve created quiz');
        }

        return NextResponse.json({
            success: true,
            quizId: savedQuiz._id.toString()
        });

    } catch (error) {
        console.error('Error creating quiz:', error);
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: error.errors[0].message },
                { status: 400 }
            );
        }
        return NextResponse.json(
            { error: 'Failed to create quiz' },
            { status: 500 }
        );
    }
} 