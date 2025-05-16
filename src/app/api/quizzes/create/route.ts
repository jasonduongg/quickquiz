import { NextResponse } from 'next/server';
import { AIService, QuizRequest } from '@/lib/ai-service';
import connectDB from '@/lib/db';
import { Quiz } from '@/models/Quiz';

const aiService = new AIService();

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { prompt, difficulty, numQuestions, additionalContext } = body;

        if (!prompt) {
            return NextResponse.json(
                { error: 'Prompt is required' },
                { status: 400 }
            );
        }

        const quizRequest: QuizRequest = {
            topic: prompt,
            difficulty: difficulty || 'medium',
            numQuestions: numQuestions || 5,
            additionalContext
        };

        // Generate quiz using AI
        const generatedQuiz = await aiService.generateQuiz(quizRequest);
        console.log('Generated quiz:', JSON.stringify(generatedQuiz, null, 2));

        // Connect to database
        await connectDB();

        // Save quiz to database
        const quiz = new Quiz({
            ...generatedQuiz,
            createdAt: new Date().toISOString(),
            attempts: []
        });
        console.log('Quiz to save:', JSON.stringify(quiz.toObject(), null, 2));

        await quiz.save();
        console.log('Saved quiz:', JSON.stringify(quiz.toObject(), null, 2));

        // Return the saved quiz
        return NextResponse.json(quiz);

    } catch (error) {
        console.error('Error creating quiz:', error);
        return NextResponse.json(
            { error: 'Failed to create quiz' },
            { status: 500 }
        );
    }
} 