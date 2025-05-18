import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Quiz, getQuizById } from '@/lib/models/quiz';
import { ObjectId } from 'mongodb';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { deleteImage } from '@/lib/db/gridfs';

export async function GET(
    request: Request,
    { params }: { params: { quizId: string } }
) {
    const { quizId } = params;

    try {
        await connectDB();

        const quiz = await Quiz.findById(quizId);
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

export async function DELETE(
    request: Request,
    { params }: { params: { quizId: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        await connectDB();

        // Get the quiz first to check ownership and get the image ID
        const quiz = await getQuizById(params.quizId);
        if (!quiz) {
            return NextResponse.json(
                { error: 'Quiz not found' },
                { status: 404 }
            );
        }

        // Check if the user is the creator of the quiz
        if (quiz.createdBy.toString() !== session.user.id) {
            return NextResponse.json(
                { error: 'You can only delete your own quizzes' },
                { status: 403 }
            );
        }

        // Delete the associated image from GridFS
        if (quiz.imageId) {
            await deleteImage(quiz.imageId);
        }

        // Delete the quiz
        const result = await Quiz.deleteOne({ _id: new ObjectId(params.quizId) });
        if (result.deletedCount === 0) {
            return NextResponse.json(
                { error: 'Failed to delete quiz' },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Error deleting quiz:', error);
        return NextResponse.json(
            { error: 'Failed to delete quiz' },
            { status: 500 }
        );
    }
} 