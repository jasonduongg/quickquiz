import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getUserQuizAttempts } from '@/lib/models/quiz';
import clientPromise from '@/lib/db/mongodb';
import { getUserByEmail } from '@/lib/models/user';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const user = await getUserByEmail(session.user.email);
        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        const attempts = await getUserQuizAttempts(user._id.toString());

        // Get quiz details for each attempt
        const client = await clientPromise;
        const db = client.db();

        const attemptsWithQuiz = await Promise.all(
            attempts.map(async (attempt) => {
                const quiz = await db.collection('quizzes').findOne(
                    { _id: attempt.quizId },
                    { projection: { title: 1, imageId: 1 } }
                );

                return {
                    ...attempt,
                    _id: attempt._id?.toString(),
                    quizId: attempt.quizId.toString(),
                    userId: attempt.userId.toString(),
                    quiz: {
                        _id: quiz?._id.toString(),
                        title: quiz?.title,
                        imageId: quiz?.imageId
                    }
                };
            })
        );

        return NextResponse.json(attemptsWithQuiz);
    } catch (error) {
        console.error('Error fetching attempt history:', error);
        return NextResponse.json(
            { error: 'Failed to fetch attempt history' },
            { status: 500 }
        );
    }
} 