import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import { getQuizStats, QuizStats, getAllQuizzes, createQuiz } from '@/lib/models/quiz';
import { getUserByEmail, incrementQuizzesCreated } from '@/lib/models/user';
import { ObjectId } from 'mongodb';

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        const { searchParams } = new URL(request.url);
        const includeStats = searchParams.get('includeStats') === 'true';

        await connectDB();
        const quizzes = await getAllQuizzes();

        // Get user's bookmarked quizzes if logged in
        let bookmarkedQuizzes: string[] = [];
        if (session?.user?.email) {
            const user = await getUserByEmail(session.user.email);
            if (user?.bookmarkedQuizzes) {
                bookmarkedQuizzes = user.bookmarkedQuizzes.map(id => id.toString());
            }
        }

        // Get stats for each quiz if requested
        const quizzesWithStats = await Promise.all(
            quizzes.map(async (quiz) => {
                const quizWithStats = {
                    quiz: {
                        ...quiz,
                        _id: quiz._id.toString(),
                        createdBy: quiz.createdBy.toString(),
                        isBookmarked: bookmarkedQuizzes.includes(quiz._id.toString())
                    },
                    stats: null as QuizStats | null
                };

                if (includeStats) {
                    const stats = await getQuizStats(quiz._id.toString());
                    quizWithStats.stats = stats;
                }

                return quizWithStats;
            })
        );

        return NextResponse.json(quizzesWithStats);
    } catch (error) {
        console.error('Error fetching quizzes:', error);
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

        const quizId = await createQuiz(quizData);
        await incrementQuizzesCreated(session.user.email);

        return NextResponse.json({ quizId: quizId.toString() });
    } catch (error) {
        console.error('Error in POST /api/quizzes:', error);
        return NextResponse.json(
            { error: 'Failed to create quiz' },
            { status: 500 }
        );
    }
} 