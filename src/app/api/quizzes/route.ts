import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Quiz } from '@/models/Quiz';

export async function GET() {
    try {
        await connectDB();

        const quizzes = await Quiz.find({}, {
            quizId: 1,
            topic: 1,
            createdAt: 1,
            attempts: 1,
            imageUrl: 1,
            'questions.id': 1,
            'questions.text': 1,
            'questions.options': 1
        }).sort({ createdAt: -1 });

        return NextResponse.json(quizzes);
    } catch (error) {
        console.error('Error in GET /api/quizzes:', error);
        return NextResponse.json(
            { error: 'Failed to fetch quizzes' },
            { status: 500 }
        );
    }
} 