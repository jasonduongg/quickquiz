import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import clientPromise from '@/lib/db/mongodb';
import { ObjectId } from 'mongodb';
import { getUserByEmail } from '@/lib/models/user';

export async function POST(
    request: Request,
    { params }: { params: { quizId: string } }
) {
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

        const quizId = new ObjectId(params.quizId);

        // Add bookmark to user's bookmarks
        await db.collection('users').updateOne(
            { _id: user._id },
            {
                $addToSet: {
                    bookmarkedQuizzes: quizId
                },
                $set: { updatedAt: new Date() }
            }
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error bookmarking quiz:', error);
        return NextResponse.json(
            { error: 'Failed to bookmark quiz' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: { quizId: string } }
) {
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

        const quizId = new ObjectId(params.quizId);

        // Remove bookmark from user's bookmarks
        await db.collection('users').updateOne(
            { _id: user._id },
            {
                $pull: {
                    bookmarkedQuizzes: quizId
                },
                $set: { updatedAt: new Date() }
            }
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error removing bookmark:', error);
        return NextResponse.json(
            { error: 'Failed to remove bookmark' },
            { status: 500 }
        );
    }
} 