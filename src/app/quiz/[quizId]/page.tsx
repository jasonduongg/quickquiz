'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';

interface QuizQuestion {
    id: number;
    text: string;
    options: string[];
}

interface QuizAttempt {
    score: number;
    totalQuestions: number;
    answers: Record<string, string>;
    gradedAt: string;
}

interface Quiz {
    quizId: string;
    topic: string;
    questions: QuizQuestion[];
    createdAt: string;
    attempts: QuizAttempt[];
}

export default function QuizPage({ params }: { params: Promise<{ quizId: string }> }) {
    const { quizId } = use(params);
    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [currentAttempt, setCurrentAttempt] = useState<{ correct: number; total: number; attemptId: number } | null>(null);

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
                    quizId: quiz.quizId,
                    answers: selectedAnswers
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to grade quiz');
            }

            const result = await response.json();
            setCurrentAttempt(result);
            setIsSubmitted(true);

            // Refresh the quiz to get updated attempts
            const quizResponse = await fetch(`/api/quizzes/${quizId}`);
            if (quizResponse.ok) {
                const updatedQuiz = await quizResponse.json();
                setQuiz(updatedQuiz);
            }
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

    const bestScore = quiz.attempts.length > 0
        ? Math.max(...quiz.attempts.map(a => a.score))
        : 0;

    return (
        <div className="max-w-3xl mx-auto px-4 py-8">
            <div className="mb-8">
                <Link
                    href="/"
                    className="text-blue-600 dark:text-blue-400 hover:underline mb-4 inline-block"
                >
                    ← Back to Quizzes
                </Link>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mt-4">
                    {quiz.topic}
                </h1>
                <div className="mt-4 space-y-4">
                    {currentAttempt && (
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                            <p className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                                Current Score: {currentAttempt.correct} out of {currentAttempt.total} correct
                            </p>
                        </div>
                    )}
                    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                            Quiz History
                        </h2>
                        {quiz.attempts.length > 0 ? (
                            <div className="space-y-2">
                                <p className="text-gray-700 dark:text-gray-300">
                                    Best Score: {bestScore} / {quiz.questions.length}
                                </p>
                                <p className="text-gray-700 dark:text-gray-300">
                                    Total Attempts: {quiz.attempts.length}
                                </p>
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                    <p>Last attempt: {new Date(quiz.attempts[quiz.attempts.length - 1].gradedAt).toLocaleString()}</p>
                                </div>
                            </div>
                        ) : (
                            <p className="text-gray-500 dark:text-gray-400 italic">
                                Not attempted yet
                            </p>
                        )}
                    </div>
                </div>
            </div>

            <div className="space-y-8">
                {quiz.questions.map((question) => (
                    <div
                        key={question.id}
                        className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6"
                    >
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                            {question.id}. {question.text}
                        </h2>
                        <div className="space-y-3">
                            {question.options.map((option, index) => (
                                <label
                                    key={index}
                                    className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${selectedAnswers[question.id] === option
                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                        }`}
                                >
                                    <input
                                        type="radio"
                                        name={`question-${question.id}`}
                                        value={option}
                                        checked={selectedAnswers[question.id] === option}
                                        onChange={() => handleAnswerSelect(question.id, option)}
                                        disabled={isSubmitted}
                                        className="mr-3"
                                    />
                                    <span className="text-gray-900 dark:text-white">
                                        {option}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {!isSubmitted && (
                <div className="mt-8 flex justify-center">
                    <button
                        onClick={handleSubmit}
                        disabled={Object.keys(selectedAnswers).length !== quiz.questions.length}
                        className={`px-6 py-3 rounded-lg font-semibold text-white ${Object.keys(selectedAnswers).length === quiz.questions.length
                            ? 'bg-blue-600 hover:bg-blue-700'
                            : 'bg-gray-400 cursor-not-allowed'
                            }`}
                    >
                        Submit Quiz
                    </button>
                </div>
            )}
        </div>
    );
} 