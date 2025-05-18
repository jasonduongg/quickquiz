import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Quiz, QuizAttempt, createQuizAttempt } from '@/lib/models/quiz';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { ObjectId } from 'mongodb';

const GradeQuizRequestSchema = z.object({
    quizId: z.string().min(1, "Quiz ID is required"),
    answers: z.record(z.string().min(1, "Answer is required"))
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

        await connectDB();

        const body = await request.json();
        const { quizId, answers } = GradeQuizRequestSchema.parse(body);

        const quiz = await Quiz.findById(quizId);
        if (!quiz) {
            return NextResponse.json(
                { error: 'Quiz not found' },
                { status: 404 }
            );
        }

        // Convert answers to the new format
        const formattedAnswers = Object.entries(answers).map(([questionIndex, selectedOption]) => {
            const question = quiz.questions[parseInt(questionIndex) - 1];
            const selectedOptionText = question.options[parseInt(selectedOption)];
            return {
                id: parseInt(questionIndex),
                yourAnswer: selectedOptionText,
                correctAnswer: question.correctAnswer,
                isCorrect: question.correctAnswer === selectedOptionText
            };
        });

        const correct = formattedAnswers.filter(a => a.isCorrect).length;
        const total = quiz.questions.length;

        // Create a new attempt
        const attempt: Omit<QuizAttempt, '_id'> = {
            quizId: quiz._id,
            userId: new ObjectId(session.user.id),
            correct,
            total,
            feedback: formattedAnswers.map(a => ({
                id: a.id,
                yourAnswer: a.yourAnswer,
                correctAnswer: a.correctAnswer
            })),
            completedAt: new Date()
        };

        await createQuizAttempt(attempt);

        return NextResponse.json({
            correct,
            total,
            feedback: formattedAnswers.map(a => ({
                id: a.id,
                yourAnswer: a.yourAnswer,
                correctAnswer: a.correctAnswer
            }))
        });
    } catch (error) {
        console.error('Error in POST /api/quizzes/grade:', error);
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: error.errors[0].message },
                { status: 400 }
            );
        }
        return NextResponse.json(
            { error: 'Failed to grade quiz' },
            { status: 500 }
        );
    }
} 