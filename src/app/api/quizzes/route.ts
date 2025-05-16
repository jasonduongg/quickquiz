import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/db';
import { Quiz, getQuizStats, getUserQuizStats, QuizStats } from '@/lib/models/quiz';
import { getUserByEmail } from '@/lib/models/user';
import { ObjectId } from 'mongodb';

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        await connectDB();

        const { searchParams } = new URL(request.url);
        const quizId = searchParams.get('id');
        const includeStats = searchParams.get('includeStats') === 'true';

        if (quizId) {
            const quiz = await Quiz.findById(quizId);
            if (!quiz) {
                return NextResponse.json(
                    { error: 'Quiz not found' },
                    { status: 404 }
                );
            }

            let stats: QuizStats | null = null;
            if (includeStats) {
                stats = await getQuizStats(quizId);
                if (session.user.id) {
                    stats.userAttempts = await getUserQuizStats(quizId, session.user.id);
                }
            }

            return NextResponse.json({
                quiz,
                stats
            });
        }

        // Get all quizzes
        const quizzes = await Quiz.find({})
            .sort({ createdAt: -1 })
            .lean();

        if (includeStats) {
            const quizzesWithStats = await Promise.all(
                quizzes.map(async (quiz) => {
                    const stats = await getQuizStats(quiz._id.toString());
                    if (session.user.id) {
                        stats.userAttempts = await getUserQuizStats(quiz._id.toString(), session.user.id);
                    }
                    return { quiz, stats };
                })
            );
            return NextResponse.json(quizzesWithStats);
        }

        return NextResponse.json(quizzes);
    } catch (error) {
        console.error('Error in GET /api/quizzes:', error);
        return NextResponse.json(
            { error: 'Failed to fetch quizzes' },
            { status: 500 }
        );
    }
}

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

        const user = await getUserByEmail(session.user.email);
        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        const body = await request.json();
        const quizData = {
            ...body,
            createdBy: new ObjectId(user._id)
        };

        const quizId = await Quiz.create(quizData);
        await Quiz.updateOne(
            { _id: quizId },
            { $inc: { 'stats.totalQuizzesCreated': 1 } }
        );

        return NextResponse.json({ quizId });
    } catch (error) {
        console.error('Error in POST /api/quizzes:', error);
        return NextResponse.json(
            { error: 'Failed to create quiz' },
            { status: 500 }
        );
    }
} 