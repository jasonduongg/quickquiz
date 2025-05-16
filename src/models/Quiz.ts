import mongoose, { Schema, Document } from 'mongoose';

export interface IQuizQuestion {
    id: number;
    text: string;
    options: string[];
    correctAnswer: string;
    explanation?: string;
}

export interface IQuizAttempt {
    score: number;
    totalQuestions: number;
    answers: Record<string, string>;
    gradedAt: string;
}

export interface IQuiz extends Document {
    quizId: string;
    topic: string;
    questions: IQuizQuestion[];
    createdAt: string;
    attempts: IQuizAttempt[];
    metadata: {
        difficulty: string;
        generatedAt: string;
        modelUsed: string;
        seed: number;
    };
    imageUrl: string;
}

const QuizQuestionSchema = new Schema<IQuizQuestion>({
    id: { type: Number, required: true },
    text: { type: String, required: true },
    options: [{ type: String, required: true }],
    correctAnswer: { type: String, required: true },
    explanation: { type: String }
});

const QuizAttemptSchema = new Schema<IQuizAttempt>({
    score: { type: Number, required: true },
    totalQuestions: { type: Number, required: true },
    answers: { type: Map, of: String, required: true },
    gradedAt: { type: String, required: true }
});

const QuizSchema = new Schema<IQuiz>({
    quizId: { type: String, required: true, unique: true },
    topic: { type: String, required: true },
    questions: [QuizQuestionSchema],
    createdAt: { type: String, required: true },
    attempts: [QuizAttemptSchema],
    metadata: {
        difficulty: { type: String, required: true },
        generatedAt: { type: String, required: true },
        modelUsed: { type: String, required: true },
        seed: { type: Number, required: true }
    },
    imageUrl: {
        type: String,
        required: true,
        default: 'https://placehold.co/512x512/e2e8f0/1e293b?text=Quiz+Image'
    }
});

// Create index only for createdAt since quizId is already indexed via unique: true
QuizSchema.index({ createdAt: -1 });

export const Quiz = mongoose.models.Quiz || mongoose.model<IQuiz>('Quiz', QuizSchema); 