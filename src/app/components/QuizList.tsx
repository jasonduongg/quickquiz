'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface QuizQuestion {
    id: number;
    text: string;
    options: string[];
}

interface QuizAttempt {
    score: number;
    totalQuestions: number;
    gradedAt: string;
}

interface Quiz {
    quizId: string;
    topic: string;
    questions: QuizQuestion[];
    createdAt: string;
    attempts: QuizAttempt[];
    imageUrl: string;
    metadata: {
        difficulty: string;
        generatedAt: string;
        modelUsed: string;
        seed: number;
    };
}

interface QuizListProps {
    searchQuery?: string;
}

export default function QuizList({ searchQuery = '' }: QuizListProps) {
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchQuizzes = async () => {
            try {
                const response = await fetch('/api/quizzes');
                if (!response.ok) {
                    throw new Error('Failed to fetch quizzes');
                }
                const data = await response.json();
                setQuizzes(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An error occurred');
            } finally {
                setLoading(false);
            }
        };

        fetchQuizzes();
    }, []);

    const filteredQuizzes = useMemo(() => {
        if (!searchQuery.trim()) return quizzes;

        const query = searchQuery.toLowerCase().trim();
        return quizzes.filter(quiz =>
            quiz.topic.toLowerCase().includes(query)
        );
    }, [quizzes, searchQuery]);

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

    if (filteredQuizzes.length === 0) {
        return (
            <div className="text-center p-4 text-gray-600 dark:text-gray-400">
                {searchQuery ? 'No quizzes found matching your search.' : 'No quizzes available. Create your first quiz!'}
            </div>
        );
    }

    return (
        <div className="grid gap-6 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {filteredQuizzes.map((quiz) => (
                <div key={quiz.quizId} className="flex flex-col">
                    <Link
                        href={`/quiz/${quiz.quizId}`}
                        className="block h-[200px] rounded-lg overflow-hidden"
                    >
                        <div className="w-full h-full perspective-1000">
                            <motion.div
                                className="relative w-full h-full"
                                initial={false}
                                whileHover={{ rotateY: 180 }}
                                transition={{
                                    duration: 0.8,
                                    type: "spring",
                                    stiffness: 50,
                                    damping: 15
                                }}
                                style={{
                                    transformStyle: "preserve-3d",
                                    transformOrigin: "center center"
                                }}
                            >
                                {/* Front - Image */}
                                <motion.div
                                    className="absolute w-full h-full cursor-pointer"
                                    style={{
                                        backfaceVisibility: "hidden",
                                        WebkitBackfaceVisibility: "hidden"
                                    }}
                                >
                                    <img
                                        src={quiz.imageUrl}
                                        alt={`Quiz about ${quiz.topic}`}
                                        className="w-full h-full object-cover rounded-lg"
                                    />
                                </motion.div>

                                {/* Back - Stats */}
                                <motion.div
                                    className="absolute w-full h-full bg-white dark:bg-gray-800 p-2 rounded-lg shadow-sm cursor-pointer"
                                    style={{
                                        backfaceVisibility: "hidden",
                                        WebkitBackfaceVisibility: "hidden",
                                        rotateY: 180
                                    }}
                                >
                                    <div className="h-full flex flex-col justify-center items-center text-center space-y-3">
                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Questions</p>
                                            <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                                {quiz.questions.length}
                                            </p>
                                        </div>
                                        {quiz.attempts && quiz.attempts.length > 0 ? (
                                            <div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Attempts</p>
                                                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                                    {quiz.attempts.length}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                    Best: {Math.max(...quiz.attempts.map(a => a.score))} / {quiz.questions.length}
                                                </p>
                                            </div>
                                        ) : (
                                            <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                                                Not attempted yet
                                            </p>
                                        )}
                                    </div>
                                </motion.div>
                            </motion.div>
                        </div>
                    </Link>
                    {/* Fixed title section - not clickable */}
                    <div className="h-10 flex items-center">
                        <h2 className="text-med font-semibold text-gray-900 dark:text-white">
                            {quiz.topic}
                        </h2>
                    </div>
                </div>
            ))}
        </div>
    );
} 