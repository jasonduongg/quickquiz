'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { ObjectId } from 'mongodb';

interface QuizQuestion {
    id: number;
    text: string;
    options: string[];
    correctAnswer: string;
    explanation?: string;
}

interface Quiz {
    _id: string;
    title: string;
    description: string;
    questions: QuizQuestion[];
    createdBy: string;
    createdAt: string;
    updatedAt: string;
    metadata: {
        difficulty: string;
        generatedAt: string;
        modelUsed: string;
        seed: number;
    };
    imageUrl: string;
}

export default function QuizPage({ params }: { params: Promise<{ quizId: string }> }) {
    const { quizId } = use(params);
    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [currentAttempt, setCurrentAttempt] = useState<{ correct: number; total: number; attemptId: string } | null>(null);

    useEffect(() => {
        const fetchQuiz = async () => {
            try {
                const response = await fetch(`/api/quizzes/${quizId}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch quiz');
                }
                const data = await response.json();
                setQuiz(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An error occurred');
            } finally {
                setLoading(false);
            }
        };

        fetchQuiz();
    }, [quizId]);

    const handleAnswerSelect = (questionId: number, answer: string) => {
        setSelectedAnswers(prev => ({
            ...prev,
            [questionId]: answer
        }));
    };

    const handleSubmit = async () => {
        if (!quiz) return;

        try {
            const response = await fetch('/api/quizzes/grade', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    quizId: quiz._id,
                    answers: selectedAnswers
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to grade quiz');
            }

            const result = await response.json();
            setCurrentAttempt(result);
            setIsSubmitted(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[200px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-red-500 text-center p-4">
                Error: {error}
            </div>
        );
    }

    if (!quiz) {
        return (
            <div className="text-center p-4 text-gray-600 dark:text-gray-400">
                Quiz not found
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-4">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">{quiz.title}</h1>
                <p className="text-gray-600 dark:text-gray-400">{quiz.description}</p>
                <div className="mt-2 text-sm text-gray-500">
                    <span className="mr-4">Difficulty: {quiz.metadata.difficulty}</span>
                    <span>Created: {new Date(quiz.createdAt).toLocaleDateString()}</span>
                </div>
            </div>

            {!isSubmitted ? (
                <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-8">
                    {quiz.questions.map((question, index) => (
                        <div key={question.id} className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                            <h3 className="text-lg font-medium mb-4">
                                {index + 1}. {question.text}
                            </h3>
                            <div className="space-y-3">
                                {question.options.map((option, optionIndex) => (
                                    <label key={optionIndex} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                                        <input
                                            type="radio"
                                            name={`question-${question.id}`}
                                            value={optionIndex.toString()}
                                            checked={selectedAnswers[question.id] === optionIndex.toString()}
                                            onChange={() => handleAnswerSelect(question.id, optionIndex.toString())}
                                            className="h-4 w-4 text-blue-600"
                                        />
                                        <span>{option}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    ))}
                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={Object.keys(selectedAnswers).length !== quiz.questions.length}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Submit Quiz
                        </button>
                    </div>
                </form>
            ) : (
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                    <h2 className="text-2xl font-bold mb-4">Quiz Results</h2>
                    <p className="text-lg mb-4">
                        You scored {currentAttempt?.correct} out of {currentAttempt?.total} questions correctly.
                    </p>
                    <div className="mt-6">
                        <Link
                            href="/"
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                            ← Back to Quizzes
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
} 