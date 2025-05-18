import { ObjectId } from 'mongodb';
import clientPromise from '../db/mongodb';

export interface UserStats {
    totalQuizzesCreated: number;  // Number of quizzes created by the user
    totalQuizzesAttempted: number; // Number of unique quizzes attempted
    lastQuizDate?: Date;          // Last quiz attempt date (for streak calculation)
    currentStreak: number;        // Current streak of daily quiz attempts
}

export interface User {
    _id?: ObjectId;
    email: string;
    name: string;
    image?: string;
    stats: UserStats;
    bookmarkedQuizzes?: ObjectId[];
    createdAt: Date;
    updatedAt: Date;
}

export const defaultUserStats: UserStats = {
    totalQuizzesCreated: 0,
    totalQuizzesAttempted: 0,
    currentStreak: 0,
};

export async function getUserByEmail(email: string) {
    const client = await clientPromise;
    const db = client.db();
    return db.collection<User>('users').findOne({ email });
}

export async function createUser(userData: Omit<User, '_id' | 'createdAt' | 'updatedAt'>) {
    const client = await clientPromise;
    const db = client.db();
    const now = new Date();

    const newUser: User = {
        ...userData,
        stats: defaultUserStats,
        createdAt: now,
        updatedAt: now,
    };

    const result = await db.collection<User>('users').insertOne(newUser);
    return result.insertedId;
}

export async function updateUserStats(email: string, stats: Partial<UserStats>) {
    const client = await clientPromise;
    const db = client.db();

    const user = await getUserByEmail(email);
    if (!user) return null;

    // Update streak logic
    if (stats.lastQuizDate) {
        const lastDate = user.stats.lastQuizDate;
        const currentDate = new Date(stats.lastQuizDate);

        if (lastDate) {
            const dayDiff = Math.floor((currentDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
            if (dayDiff === 1) {
                stats.currentStreak = (user.stats.currentStreak || 0) + 1;
            } else if (dayDiff > 1) {
                stats.currentStreak = 1;
            }
        } else {
            stats.currentStreak = 1;
        }
    }

    const updatedStats: UserStats = {
        totalQuizzesCreated: stats.totalQuizzesCreated ?? user.stats.totalQuizzesCreated,
        totalQuizzesAttempted: stats.totalQuizzesAttempted ?? user.stats.totalQuizzesAttempted,
        currentStreak: stats.currentStreak ?? user.stats.currentStreak,
        lastQuizDate: stats.lastQuizDate ?? user.stats.lastQuizDate,
    };

    return db.collection<User>('users').updateOne(
        { email },
        {
            $set: {
                'stats': updatedStats,
                updatedAt: new Date()
            }
        }
    );
}

export async function incrementQuizzesCreated(email: string) {
    const client = await clientPromise;
    const db = client.db();

    return db.collection<User>('users').updateOne(
        { email },
        {
            $inc: { 'stats.totalQuizzesCreated': 1 },
            $set: { updatedAt: new Date() }
        }
    );
}

export async function incrementQuizzesAttempted(email: string) {
    const client = await clientPromise;
    const db = client.db();

    return db.collection<User>('users').updateOne(
        { email },
        {
            $inc: { 'stats.totalQuizzesAttempted': 1 },
            $set: {
                'stats.lastQuizDate': new Date(),
                updatedAt: new Date()
            }
        }
    );
} 