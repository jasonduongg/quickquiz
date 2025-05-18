'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ClockIcon, ChartBarIcon } from '@heroicons/react/24/outline';

interface Attempt {
    _id: string;
    quizId: string;
    userId: string;
    correct: number;
    total: number;
    completedAt: string;
    quiz: {
        _id: string;
        title: string;
        imageId: string;
    };
}

export default function AttemptHistory() {
    const { data: session } = useSession();
    const [attempts, setAttempts] = useState<Attempt[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (session?.user?.id) {
            fetchAttempts();
        }
    }, [session?.user?.id]);

    const fetchAttempts = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await fetch('/api/attempts/history');
            if (!response.ok) {
                throw new Error('Failed to fetch attempt history');
            }
            const data = await response.json();
            setAttempts(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    if (!session) {
        return (
            <div className="text-center text-gray-500 py-4">
                Sign in to view your attempt history
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-900">Recent Attempts</h2>
            </div>

            <div>
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="animate-pulse">
                                <div className="h-24 bg-gray-200 rounded-lg"></div>
                            </div>
                        ))}
                    </div>
                ) : error ? (
                    <div className="text-red-500 text-sm text-center py-4">
                        {error}
                    </div>
                ) : attempts.length === 0 ? (
                    <div className="text-gray-500 text-sm text-center py-4">
                        No attempts yet
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-3">
                        {attempts.map((attempt) => (
                            <motion.div
                                key={attempt._id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.15 }}
                                className="h-full"
                            >
                                <Link
                                    href={`/quiz/${attempt.quizId}`}
                                    className="block group h-full"
                                >
                                    <div className="bg-white rounded-lg border border-gray-200 p-2 hover:border-gray-300 transition-colors h-full">
                                        <div className="flex gap-3 h-full">
                                            <div className="relative w-20 h-20 flex-shrink-0">
                                                <img
                                                    src={`/api/images/${attempt.quiz.imageId}`}
                                                    alt={attempt.quiz.title}
                                                    className="w-full h-full object-cover rounded-md"
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-xs font-medium text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                                                    {attempt.quiz.title}
                                                </h3>
                                                <div className="mt-1 flex items-center gap-2 text-[11px] text-gray-500">
                                                    <div className="flex items-center gap-1">
                                                        <ChartBarIcon className="w-3 h-3" />
                                                        <span>
                                                            {typeof attempt.correct === 'number' && typeof attempt.total === 'number'
                                                                ? `${attempt.correct}/${attempt.total} (${Math.round((attempt.correct / attempt.total) * 100)}%)`
                                                                : 'N/A'}
                                                        </span>
                                                    </div>
                                                    <span className="text-gray-300">|</span>
                                                    <div className="flex items-center gap-1">
                                                        <ClockIcon className="w-3 h-3" />
                                                        <span>
                                                            {attempt.completedAt && !isNaN(new Date(attempt.completedAt).getTime())
                                                                ? new Date(attempt.completedAt).toLocaleDateString('en-US', {
                                                                    year: 'numeric',
                                                                    month: 'short',
                                                                    day: 'numeric'
                                                                })
                                                                : 'N/A'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
} 