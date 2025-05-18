'use client';

import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { PlusIcon } from '@heroicons/react/24/outline';
import CreateQuizModal from './CreateQuizModal';
import { QuizCard, CarouselSkeleton, GridSkeleton } from './QuizCard';

interface QuizQuestion {
    id: number;
    text: string;
    options: string[];
}

interface QuizStats {
    totalAttempts: number;
    averageScore: number;
    uniqueUsers: number;
    userAttempts: {
        attempts: number;
        averageScore: number;
        bestScore: number;
        lastAttempt: Date;
    } | null;
}

interface Quiz {
    _id: string;
    title: string;
    description: string;
    questions: QuizQuestion[];
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
    stats?: QuizStats;
    isBookmarked?: boolean;
}

interface QuizListProps {
    searchQuery?: string;
}

export default function QuizList({ searchQuery = '' }: QuizListProps) {
    const { data: session } = useSession();
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deletingQuizId, setDeletingQuizId] = useState<string | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isGlobalGridView, setIsGlobalGridView] = useState(false);
    const [isMyQuizzesGridView, setIsMyQuizzesGridView] = useState(false);
    const [bookmarkingQuizId, setBookmarkingQuizId] = useState<string | null>(null);

    const fetchQuizzes = async () => {
        try {
            const response = await fetch('/api/quizzes?includeStats=true');
            if (!response.ok) {
                throw new Error('Failed to fetch quizzes');
            }
            const data = await response.json();

            const transformedQuizzes = data.map((item: { quiz: Quiz, stats: QuizStats }) => ({
                ...item.quiz,
                stats: item.stats,
                isBookmarked: item.quiz.isBookmarked || false
            }));
            setQuizzes(transformedQuizzes);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQuizzes();
    }, []);

    const filteredQuizzes = useMemo(() => {
        if (!searchQuery.trim()) return quizzes;

        const query = searchQuery.toLowerCase().trim();
        return quizzes.filter(quiz =>
            quiz.title.toLowerCase().includes(query) ||
            quiz.description.toLowerCase().includes(query)
        );
    }, [quizzes, searchQuery]);

    const myQuizzes = useMemo(() => {
        if (!session?.user?.id) return [];
        return filteredQuizzes.filter(quiz => quiz.createdBy === session.user.id);
    }, [filteredQuizzes, session?.user?.id]);

    const otherQuizzes = useMemo(() => {
        if (!session?.user?.id) return filteredQuizzes;
        return filteredQuizzes.filter(quiz => quiz.createdBy !== session?.user?.id);
    }, [filteredQuizzes, session?.user?.id]);

    const handleDeleteQuiz = async (quizId: string) => {
        if (!confirm('Are you sure you want to delete this quiz? This action cannot be undone.')) {
            return;
        }

        try {
            setDeletingQuizId(quizId);
            const response = await fetch(`/api/quizzes/${quizId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to delete quiz');
            }

            setQuizzes(quizzes.filter(quiz => quiz._id !== quizId));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete quiz');
        } finally {
            setDeletingQuizId(null);
        }
    };

    const handleQuizCreated = () => {
        // Refresh the quiz list
        fetchQuizzes();
    };

    const handleGlobalViewToggle = () => {
        setIsGlobalGridView(!isGlobalGridView);
        if (!isGlobalGridView) {
            setIsMyQuizzesGridView(false); // Hide my quizzes when showing global grid
        }
    };

    const handleMyQuizzesViewToggle = () => {
        setIsMyQuizzesGridView(!isMyQuizzesGridView);
        if (!isMyQuizzesGridView) {
            setIsGlobalGridView(false); // Hide global quizzes when showing my quizzes grid
        }
    };

    const handleBookmarkToggle = async (quizId: string, currentBookmarkState: boolean) => {
        if (!session?.user?.id) return;

        try {
            setBookmarkingQuizId(quizId);
            const response = await fetch(`/api/quizzes/${quizId}/bookmark`, {
                method: currentBookmarkState ? 'DELETE' : 'POST',
            });

            if (!response.ok) {
                throw new Error('Failed to update bookmark');
            }

            setQuizzes(quizzes.map(quiz =>
                quiz._id === quizId
                    ? { ...quiz, isBookmarked: !currentBookmarkState }
                    : quiz
            ));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update bookmark');
        } finally {
            setBookmarkingQuizId(null);
        }
    };

    if (error) {
        return (
            <div className="text-red-500 text-center p-4">
                Error: {error}
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* My Quizzes Section - Only show when logged in */}
            {session?.user?.id && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <h2 className="text-xl font-bold text-black">My Quizzes</h2>
                            {!loading && myQuizzes.length > 0 && (
                                <button
                                    onClick={() => setIsCreateModalOpen(true)}
                                    className="flex items-center gap-1 px-3 py-1 bg-blue-700 text-white text-sm rounded-lg hover:bg-blue-800 transition-colors"
                                >
                                    <PlusIcon className="w-4 h-4" />
                                    <span>Create</span>
                                </button>
                            )}
                        </div>
                        {!loading && myQuizzes.length > 0 && (
                            <button
                                onClick={handleMyQuizzesViewToggle}
                                className="flex items-center gap-1 px-3 py-1 bg-blue-700 text-white text-sm rounded-lg hover:bg-blue-800 transition-colors"
                            >
                                {isMyQuizzesGridView ? 'Show Carousel' : 'View All'}
                            </button>
                        )}
                    </div>

                    <AnimatePresence mode="wait">
                        {loading ? (
                            <motion.div
                                key="my-quizzes-skeleton"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                            >
                                {isMyQuizzesGridView ? <GridSkeleton /> : <CarouselSkeleton />}
                            </motion.div>
                        ) : isMyQuizzesGridView ? (
                            <motion.div
                                key="my-quizzes-grid"
                                initial={{ opacity: 0, x: 100 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{
                                    type: "spring",
                                    stiffness: 300,
                                    damping: 30
                                }}
                                className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3"
                            >
                                {myQuizzes.map((quiz) => (
                                    <QuizCard
                                        key={quiz._id}
                                        quiz={quiz}
                                        isCarousel={false}
                                        onDelete={handleDeleteQuiz}
                                        onBookmarkToggle={handleBookmarkToggle}
                                        deletingQuizId={deletingQuizId}
                                        bookmarkingQuizId={bookmarkingQuizId}
                                    />
                                ))}
                            </motion.div>
                        ) : (
                            <motion.div
                                key="my-quizzes-carousel"
                                initial={{ opacity: 0, x: -100 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{
                                    type: "spring",
                                    stiffness: 300,
                                    damping: 30
                                }}
                            >
                                <div className="relative h-[220px]">
                                    <div
                                        id="my-quizzes-carousel"
                                        className="flex gap-3 overflow-x-auto overflow-y-hidden scrollbar-hide absolute inset-0"
                                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                                    >
                                        {myQuizzes.length > 0 ? (
                                            myQuizzes.map((quiz) => (
                                                <QuizCard
                                                    key={quiz._id}
                                                    quiz={quiz}
                                                    isCarousel={true}
                                                    onDelete={handleDeleteQuiz}
                                                    onBookmarkToggle={handleBookmarkToggle}
                                                    deletingQuizId={deletingQuizId}
                                                    bookmarkingQuizId={bookmarkingQuizId}
                                                />
                                            ))
                                        ) : (
                                            <button
                                                onClick={() => setIsCreateModalOpen(true)}
                                                className="min-w-[280px] w-[280px] h-[200px] bg-white dark:bg-gray-800 rounded-lg shadow-sm border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 transition-colors flex flex-col items-center justify-center gap-3 group"
                                            >
                                                <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center group-hover:bg-gray-200 dark:group-hover:bg-gray-600 transition-colors">
                                                    <PlusIcon className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                                                </div>
                                                <div className="text-center">
                                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Create Your First Quiz</h3>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Start sharing your knowledge</p>
                                                </div>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}

            {/* Global Quizzes Section */}
            {filteredQuizzes.length > 0 && !isMyQuizzesGridView && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-black">
                            {session?.user?.id ? 'Global Quizzes' : 'All Quizzes'}
                        </h2>
                        {!loading && filteredQuizzes.length > 0 && (
                            <button
                                onClick={handleGlobalViewToggle}
                                className="flex items-center gap-1 px-3 py-1 bg-blue-700 text-white text-sm rounded-lg hover:bg-blue-800 transition-colors"
                            >
                                {isGlobalGridView ? 'Show Carousel' : 'View All'}
                            </button>
                        )}
                    </div>

                    <AnimatePresence mode="wait">
                        {loading ? (
                            <motion.div
                                key="global-quizzes-skeleton"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                            >
                                {isGlobalGridView ? <GridSkeleton /> : <CarouselSkeleton />}
                            </motion.div>
                        ) : isGlobalGridView ? (
                            <motion.div
                                key="global-grid"
                                initial={{ opacity: 0, x: 100 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{
                                    type: "spring",
                                    stiffness: 300,
                                    damping: 30
                                }}
                                className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3"
                            >
                                {filteredQuizzes.map((quiz) => (
                                    <QuizCard
                                        key={quiz._id}
                                        quiz={quiz}
                                        isCarousel={false}
                                        onDelete={handleDeleteQuiz}
                                        onBookmarkToggle={handleBookmarkToggle}
                                        deletingQuizId={deletingQuizId}
                                        bookmarkingQuizId={bookmarkingQuizId}
                                    />
                                ))}
                            </motion.div>
                        ) : (
                            <motion.div
                                key="global-carousel"
                                initial={{ opacity: 0, x: -100 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{
                                    type: "spring",
                                    stiffness: 300,
                                    damping: 30
                                }}
                            >
                                {session?.user?.id ? (
                                    <div className="relative h-[220px]">
                                        <div
                                            id="global-quizzes-carousel"
                                            className="flex gap-3 overflow-x-auto overflow-y-hidden scrollbar-hide absolute inset-0"
                                            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                                        >
                                            {otherQuizzes.map((quiz) => (
                                                <QuizCard
                                                    key={quiz._id}
                                                    quiz={quiz}
                                                    isCarousel={true}
                                                    onDelete={handleDeleteQuiz}
                                                    onBookmarkToggle={handleBookmarkToggle}
                                                    deletingQuizId={deletingQuizId}
                                                    bookmarkingQuizId={bookmarkingQuizId}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                                        {filteredQuizzes.map((quiz) => (
                                            <QuizCard
                                                key={quiz._id}
                                                quiz={quiz}
                                                isCarousel={false}
                                                onDelete={handleDeleteQuiz}
                                                onBookmarkToggle={handleBookmarkToggle}
                                                deletingQuizId={deletingQuizId}
                                                bookmarkingQuizId={bookmarkingQuizId}
                                            />
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}

            {filteredQuizzes.length === 0 && !session?.user?.id && (
                <div className="text-center p-4 text-gray-600 dark:text-gray-400">
                    No quizzes available.
                </div>
            )}

            <CreateQuizModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onQuizCreated={handleQuizCreated}
            />
        </div>
    );
} 