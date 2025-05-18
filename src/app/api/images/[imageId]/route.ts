import { NextRequest, NextResponse } from 'next/server';
import { GridFSBucket, ObjectId } from 'mongodb';
import clientPromise from '@/lib/db/mongodb';

export async function GET(
    request: NextRequest,
    context: { params: { imageId: string } }
) {
    try {
        const { imageId } = context.params;
        const client = await clientPromise;
        const db = client.db();
        const bucket = new GridFSBucket(db, { bucketName: 'quizImages' });

        // Find the file metadata
        const files = await bucket.find({ _id: new ObjectId(imageId) }).toArray();
        if (files.length === 0) {
            return new NextResponse('Image not found', { status: 404 });
        }

        const file = files[0];
        const downloadStream = bucket.openDownloadStream(new ObjectId(imageId));

        // Convert the stream to a buffer
        const chunks: Buffer[] = [];
        for await (const chunk of downloadStream) {
            chunks.push(chunk);
        }
        const buffer = Buffer.concat(chunks);

        // Return the image with appropriate headers
        return new NextResponse(buffer, {
            headers: {
                'Content-Type': file.contentType || 'image/jpeg',
                'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
            },
        });
    } catch (error) {
        console.error('Error serving image:', error);
        return new NextResponse('Error serving image', { status: 500 });
    }
} 