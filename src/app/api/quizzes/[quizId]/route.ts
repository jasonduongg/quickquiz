import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Quiz } from '@/models/Quiz';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ quizId: string }> }
) {
    const { quizId } = await params;

    try {
        await connectDB();

        const quiz = await Quiz.findOne(
            { quizId },
            {
                quizId: 1,
                topic: 1,
                questions: 1,
                createdAt: 1,
                attempts: 1,
                metadata: 1,
                imageUrl: 1
            }
        );

        if (!quiz) {
            return NextResponse.json(
                { error: 'Quiz not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(quiz);

    } catch (error) {
        console.error('Error fetching quiz:', error);
        return NextResponse.json(
            { error: 'Failed to fetch quiz' },
            { status: 500 }
        );
    }
} 