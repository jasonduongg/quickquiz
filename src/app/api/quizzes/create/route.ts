import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { AIService, QuizRequest } from '@/lib/ai-service';
import connectDB from '@/lib/db';
import { Quiz, createQuiz, CreateQuizData } from '@/lib/models/quiz';
import { authOptions } from '@/lib/auth';
import { ObjectId } from 'mongodb';
import { z } from 'zod';
import { getUserByEmail } from '@/lib/models/user';
import { uploadImage } from '@/lib/db/gridfs';

const aiService = new AIService();

const CreateQuizRequestSchema = z.object({
    topic: z.string().min(1, "Topic is required"),
    difficulty: z.enum(['easy', 'medium', 'hard']).optional().default('medium'),
    numQuestions: z.number().min(1).max(20).optional().default(5)
});

export async function POST(request: Request) {
    try {
        console.log('Starting quiz creation...');

        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            console.log('No session or user email found');
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }
        console.log('User authenticated:', session.user.email);

        const body = await request.json();
        console.log('Request body:', JSON.stringify(body, null, 2));

        const { topic, difficulty, numQuestions } = CreateQuizRequestSchema.parse(body);
        console.log('Parsed request data:', { topic, difficulty, numQuestions });

        // Connect to database first to get user
        await connectDB();
        const user = await getUserByEmail(session.user.email);
        if (!user) {
            console.log('User not found in database');
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }
        console.log('User found in database:', user._id.toString());

        const quizRequest: QuizRequest = {
            topic,
            difficulty,
            numQuestions
        };
        console.log('Calling AI service with request:', JSON.stringify(quizRequest, null, 2));

        try {
            const generatedQuiz = await aiService.generateQuiz(quizRequest);
            console.log('AI Service Response:', JSON.stringify(generatedQuiz, null, 2));

            if (!generatedQuiz || !generatedQuiz.topic || !generatedQuiz.questions || !generatedQuiz.metadata) {
                console.error('Invalid AI service response:', generatedQuiz);
                throw new Error('Invalid quiz data from AI service');
            }

            const imageResponse = await fetch(generatedQuiz.imageUrl);
            if (!imageResponse.ok) {
                throw new Error('Failed to fetch quiz image');
            }
            const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
            const imageId = await uploadImage(imageBuffer, `quiz-${Date.now()}.jpg`);
            console.log('Image uploaded with ID:', imageId);

            // Create quiz data using the AI service response directly
            const quizData: CreateQuizData = {
                title: generatedQuiz.topic,
                description: `A ${generatedQuiz.metadata.difficulty} difficulty quiz about ${generatedQuiz.topic}`,
                questions: generatedQuiz.questions,
                createdBy: new ObjectId(user._id),
                metadata: {
                    difficulty: generatedQuiz.metadata.difficulty,
                    generatedAt: generatedQuiz.metadata.generatedAt,
                    modelUsed: generatedQuiz.metadata.modelUsed,
                    seed: generatedQuiz.metadata.seed
                },
                imageId: imageId
            };

            console.log('Quiz data being saved:', JSON.stringify(quizData, null, 2));

            const quizId = await createQuiz(quizData);
            console.log('Quiz saved with ID:', quizId.toString());

            const savedQuiz = await Quiz.findById(quizId);
            console.log('Retrieved saved quiz:', JSON.stringify(savedQuiz, null, 2));

            if (!savedQuiz) {
                throw new Error('Failed to retrieve created quiz');
            }

            return NextResponse.json({
                success: true,
                quizId: savedQuiz._id.toString()
            });

        } catch (aiError) {
            console.error('Error in AI service or quiz creation:', aiError);
            throw aiError;
        }

    } catch (error) {
        console.error('Error in quiz creation endpoint:', error);
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