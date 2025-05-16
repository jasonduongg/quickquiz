import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Quiz, IQuizQuestion, IQuizAttempt } from '@/models/Quiz';
import { z } from 'zod';

const GradeQuizRequestSchema = z.object({
    quizId: z.string().min(1, "Quiz ID is required"),
    answers: z.record(z.string().min(1, "Answer is required"))
});

export async function POST(request: Request) {
    try {
        await connectDB();

        const body = await request.json();
        const { quizId, answers } = GradeQuizRequestSchema.parse(body);

        const quiz = await Quiz.findOne({ quizId });
        if (!quiz) {
            return NextResponse.json(
                { error: 'Quiz not found' },
                { status: 404 }
            );
        }

        const feedback = quiz.questions.map((q: IQuizQuestion) => ({
            id: q.id,
            yourAnswer: answers[q.id.toString()] || '',
            correctAnswer: q.correctAnswer
        }));

        const correct = feedback.filter((f: { yourAnswer: string; correctAnswer: string }) =>
            f.yourAnswer === f.correctAnswer
        ).length;

        // Create a new attempt
        const attempt: IQuizAttempt = {
            score: correct,
            totalQuestions: quiz.questions.length,
            answers,
            gradedAt: new Date()
        };

        // Add the attempt to the quiz
        quiz.attempts.push(attempt);
        await quiz.save();

        return NextResponse.json({
            correct,
            total: quiz.questions.length,
            feedback,
            attemptId: quiz.attempts.length - 1
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