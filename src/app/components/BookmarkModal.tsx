import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/24/solid';
import { QuizCard } from './QuizCard';

interface Question {
    id: number;
    text: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
}
interface Quiz {
    _id: string;
    title: string;
    description: string;
    questions: Question[];
    createdAt: string;
    updatedAt: string;
    createdBy: string;
    metadata: {
        difficulty: string;
        generatedAt: string;
        modelUsed: string;
        seed: number;
    };
    imageId: string;
    stats?: {
        totalAttempts?: number;
        averageScore?: number;
        lastAttempted?: string;
    };
    isBookmarked?: boolean;
}

interface BookmarkModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function BookmarkModal({ isOpen, onClose }: BookmarkModalProps) {
    const [bookmarkedQuizzes, setBookmarkedQuizzes] = useState<Quiz[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            fetchBookmarkedQuizzes();
        }
    }, [isOpen]);

    const fetchBookmarkedQuizzes = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await fetch('/api/quizzes/bookmarked');
            if (!response.ok) {
                throw new Error('Failed to fetch bookmarked quizzes');
            }
            const data = await response.json();
            setBookmarkedQuizzes(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleBookmarkToggle = async (quizId: string, currentBookmarkState: boolean) => {
        try {
            const response = await fetch(`/api/quizzes/${quizId}/bookmark`, {
                method: currentBookmarkState ? 'DELETE' : 'POST',
            });

            if (!response.ok) {
                throw new Error('Failed to update bookmark');
            }

            // Remove the quiz from the list if it was unbookmarked
            if (currentBookmarkState) {
                setBookmarkedQuizzes(quizzes => quizzes.filter(quiz => quiz._id !== quizId));
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update bookmark');
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop with blur */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 min-h-[100dvh] bg-black/20  backdrop-blur-sm z-40"
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 30
                        }}
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-5xl bg-white rounded-xl shadow-lg z-50 p-4"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <BookmarkSolidIcon className="w-5 h-5 text-blue-600" />
                                <h2 className="text-lg font-bold text-gray-900">Bookmarked Quizzes</h2>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <XMarkIcon className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        <div className="relative h-[500px]">
                            {loading ? (
                                <div className="flex items-center justify-center h-full">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                                </div>
                            ) : error ? (
                                <div className="flex items-center justify-center h-full text-red-500">
                                    {error}
                                </div>
                            ) : bookmarkedQuizzes.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                                    <BookmarkSolidIcon className="w-10 h-10 mb-2 text-gray-400" />
                                    <p>No bookmarked quizzes yet</p>
                                </div>
                            ) : (
                                <div
                                    className="grid grid-cols-3 gap-3 overflow-y-auto overflow-x-hidden absolute inset-0 pb-4 pr-2"
                                    style={{ scrollbarWidth: 'thin' }}
                                >
                                    {bookmarkedQuizzes.map((quiz) => (
                                        <QuizCard
                                            key={quiz._id}
                                            quiz={quiz}
                                            isCarousel={false}
                                            onBookmarkToggle={handleBookmarkToggle}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
} 