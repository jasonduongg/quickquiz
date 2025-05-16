import { GridFSBucket, ObjectId } from 'mongodb';
import clientPromise from './mongodb';

export async function uploadImage(imageBuffer: Buffer, filename: string): Promise<string> {
    const client = await clientPromise;
    const db = client.db();
    const bucket = new GridFSBucket(db, { bucketName: 'quizImages' });

    // Upload the image
    const uploadStream = bucket.openUploadStream(filename, {
        contentType: 'image/jpeg', // or determine from the image
        metadata: {
            uploadedAt: new Date()
        }
    });

    return new Promise((resolve, reject) => {
        uploadStream.on('finish', () => {
            resolve(uploadStream.id.toString());
        });
        uploadStream.on('error', reject);
        uploadStream.end(imageBuffer);
    });
}

export async function getImageUrl(imageId: string): Promise<string> {
    const client = await clientPromise;
    const db = client.db();
    const bucket = new GridFSBucket(db, { bucketName: 'quizImages' });

    // Check if the image exists
    const files = await bucket.find({ _id: new ObjectId(imageId) }).toArray();
    if (files.length === 0) {
        throw new Error('Image not found');
    }

    // Return the image URL (we'll serve it through an API route)
    return `/api/images/${imageId}`;
}

export async function deleteImage(imageId: string): Promise<void> {
    const client = await clientPromise;
    const db = client.db();
    const bucket = new GridFSBucket(db, { bucketName: 'quizImages' });

    await bucket.delete(new ObjectId(imageId));
} 