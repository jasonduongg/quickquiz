import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import clientPromise from '@/lib/db/mongodb';
import { ObjectId } from 'mongodb';
import { getUserByEmail } from '@/lib/models/user';

interface Question {
    id: number;
    text: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
}

interface QuizMetadata {
    difficulty: string;
    generatedAt: string;
    modelUsed: string;
    seed: number;
}

interface Quiz {
    _id: ObjectId;
    title: string;
    description: string;
    questions: Question[];
    createdAt: string;
    updatedAt: string;
    createdBy: ObjectId;
    metadata: QuizMetadata;
    imageId: string;
    stats?: {
        totalAttempts?: number;
        averageScore?: number;
        lastAttempted?: string;
    };
}

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const client = await clientPromise;
        const db = client.db();
        const user = await getUserByEmail(session.user.email);

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Get all bookmarked quiz IDs for the user
        const bookmarkedQuizIds = (user.bookmarkedQuizzes || []).map(id => new ObjectId(id));

        // Fetch the actual quiz documents
        const quizzes = await db.collection<Quiz>('quizzes')
            .find({ _id: { $in: bookmarkedQuizIds } })
            .sort({ createdAt: -1 })
            .toArray();

        // Add isBookmarked flag to each quiz
        const quizzesWithBookmarkFlag = quizzes.map((quiz: Quiz) => ({
            ...quiz,
            _id: quiz._id.toString(),
            isBookmarked: true
        }));

        return NextResponse.json(quizzesWithBookmarkFlag);
    } catch (error) {
        console.error('Error fetching bookmarked quizzes:', error);
        return NextResponse.json(
            { error: 'Failed to fetch bookmarked quizzes' },
            { status: 500 }
        );
    }
} 