import { Schema, model, Document, models } from 'mongoose';
import { ObjectId } from 'mongodb';
import clientPromise from '../db/mongodb';

// Mongoose Schema and Model
export interface IQuizQuestion {
    id: number;
    text: string;
    options: string[];
    correctAnswer: string;
    explanation?: string;
}

export interface IQuiz extends Document {
    _id: ObjectId;
    title: string;
    description?: string;
    questions: IQuizQuestion[];
    createdBy: ObjectId;
    createdAt: Date;
    updatedAt: Date;
    metadata: {
        difficulty: string;
        generatedAt: string;
        modelUsed: string;
        seed: number;
    };
    imageId: string;
}

const QuizQuestionSchema = new Schema<IQuizQuestion>({
    id: { type: Number, required: true },
    text: { type: String, required: true },
    options: [{ type: String, required: true }],
    correctAnswer: { type: String, required: true },
    explanation: { type: String }
});

const QuizSchema = new Schema<IQuiz>({
    title: { type: String, required: true },
    description: { type: String, required: false },
    questions: [QuizQuestionSchema],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    metadata: {
        difficulty: { type: String, required: true },
        generatedAt: { type: String, required: true },
        modelUsed: { type: String, required: true },
        seed: { type: Number, required: true }
    },
    imageId: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

// Create indexes
QuizSchema.index({ createdAt: -1 });
QuizSchema.index({ createdBy: 1 });

// Use a singleton pattern to prevent model recompilation
export const Quiz = models.Quiz || model<IQuiz>('Quiz', QuizSchema);

// MongoDB Native Functions
export interface QuizAttempt {
    _id?: ObjectId;
    quizId: ObjectId;
    userId: ObjectId;
    correct: number;
    total: number;
    feedback: {
        id: number;
        yourAnswer: string;
        correctAnswer: string;
    }[];
    completedAt: Date;
}

export async function createQuizAttempt(attemptData: Omit<QuizAttempt, '_id'>) {
    const client = await clientPromise;
    const db = client.db();
    const result = await db.collection<QuizAttempt>('quizAttempts').insertOne(attemptData);
    return result.insertedId;
}

export async function getQuizById(id: string) {
    const client = await clientPromise;
    const db = client.db();
    return db.collection<IQuiz>('quizzes').findOne({ _id: new ObjectId(id) });
}

export async function getAllQuizzes() {
    const client = await clientPromise;
    const db = client.db();
    return db.collection<IQuiz>('quizzes').find({}).toArray();
}

export interface CreateQuizData {
    title: string;
    description?: string;
    questions: IQuizQuestion[];
    createdBy: ObjectId;
    metadata: {
        difficulty: string;
        generatedAt: string;
        modelUsed: string;
        seed: number;
    };
    imageId: string;
}

// Add a new interface for MongoDB documents
export interface QuizDocument {
    _id: ObjectId;
    title: string;
    description?: string;
    questions: IQuizQuestion[];
    createdBy: ObjectId;
    metadata: {
        difficulty: string;
        generatedAt: string;
        modelUsed: string;
        seed: number;
    };
    imageId: string;
    createdAt: Date;
    updatedAt: Date;
}

export async function createQuiz(quizData: CreateQuizData) {
    const client = await clientPromise;
    const db = client.db();
    const now = new Date();

    // Create a plain MongoDB document
    const newQuiz: QuizDocument = {
        _id: new ObjectId(),
        title: quizData.title,
        description: quizData.description,
        questions: quizData.questions,
        createdBy: quizData.createdBy,
        metadata: quizData.metadata,
        imageId: quizData.imageId,
        createdAt: now,
        updatedAt: now
    };

    // Log the data being saved
    console.log('Saving quiz data:', JSON.stringify(newQuiz, null, 2));

    const result = await db.collection<QuizDocument>('quizzes').insertOne(newQuiz);

    // Verify the saved data
    const savedQuiz = await db.collection<QuizDocument>('quizzes').findOne({ _id: result.insertedId });
    console.log('Saved quiz data:', JSON.stringify(savedQuiz, null, 2));

    if (!savedQuiz) {
        throw new Error('Failed to verify saved quiz data');
    }

    return result.insertedId;
}

export async function getUserQuizAttempts(userId: string) {
    const client = await clientPromise;
    const db = client.db();
    return db.collection<QuizAttempt>('quizAttempts')
        .find({ userId: new ObjectId(userId) })
        .sort({ completedAt: -1 })
        .toArray();
}

export async function getQuizAttempts(quizId: string) {
    const client = await clientPromise;
    const db = client.db();
    return db.collection<QuizAttempt>('quizAttempts')
        .find({ quizId: new ObjectId(quizId) })
        .sort({ completedAt: -1 })
        .toArray();
}

export interface QuizStats {
    totalAttempts: number;
    averageScore: number;
    bestScore: number;
    uniqueUsers: number;
    userAttempts: {
        attempts: number;
        averageScore: number;
        bestScore: number;
        lastAttempt: Date;
    } | null;
}

export async function getQuizStats(quizId: string): Promise<QuizStats> {
    const client = await clientPromise;
    const db = client.db();
    const attempts = await db.collection<QuizAttempt>('quizAttempts')
        .find({ quizId: new ObjectId(quizId) })
        .toArray();

    if (attempts.length === 0) {
        return {
            totalAttempts: 0,
            averageScore: 0,
            bestScore: 0,
            uniqueUsers: 0,
            userAttempts: null
        };
    }

    const uniqueUsers = new Set(attempts.map(a => a.userId.toString())).size;
    const scores = attempts.map(a => (a.correct / a.total) * 100);
    const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const bestScore = Math.max(...scores);

    return {
        totalAttempts: attempts.length,
        averageScore,
        bestScore,
        uniqueUsers,
        userAttempts: null
    };
}

export async function getUserQuizStats(quizId: string, userId: string): Promise<QuizStats['userAttempts']> {
    const client = await clientPromise;
    const db = client.db();
    const attempts = await db.collection<QuizAttempt>('quizAttempts')
        .find({
            quizId: new ObjectId(quizId),
            userId: new ObjectId(userId)
        })
        .sort({ completedAt: -1 })
        .toArray();

    if (attempts.length === 0) {
        return null;
    }

    const scores = attempts.map(a => (a.correct / a.total) * 100);
    const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const bestScore = Math.max(...scores);

    return {
        attempts: attempts.length,
        averageScore,
        bestScore,
        lastAttempt: attempts[0].completedAt
    };
}

// Drop old indexes and ensure we have the correct ones
export async function ensureIndexes() {
    const client = await clientPromise;
    const db = client.db();
    const collection = db.collection('quizzes');

    // Drop all existing indexes except _id
    const indexes = await collection.indexes();
    for (const index of indexes) {
        if (index.name && index.name !== '_id_') {
            await collection.dropIndex(index.name);
        }
    }

    // Create new indexes
    await collection.createIndex({ createdAt: -1 });
    await collection.createIndex({ createdBy: 1 });
}

// Call ensureIndexes when the module is loaded
ensureIndexes().catch(console.error);
