'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { EyeIcon, TrashIcon, PlusIcon, UserIcon } from '@heroicons/react/24/outline';
import CreateQuizModal from '@/components/CreateQuizModal';

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

    const fetchQuizzes = async () => {
        try {
            const response = await fetch('/api/quizzes?includeStats=true');
            if (!response.ok) {
                throw new Error('Failed to fetch quizzes');
            }
            const data = await response.json();

            const transformedQuizzes = data.map((item: { quiz: Quiz, stats: QuizStats }) => ({
                ...item.quiz,
                stats: item.stats
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

    const QuizCard = ({ quiz, isCarousel = false }: { quiz: Quiz, isCarousel?: boolean }) => {
        return (
            <div className={`flex flex-col ${isCarousel ? 'min-w-[280px] w-[280px]' : 'w-full'}`}>
                <div className="relative w-full">
                    <Link
                        href={`/quiz/${quiz._id}`}
                        className={`block ${isCarousel ? 'h-[200px]' : 'aspect-[4/3]'} rounded-lg overflow-hidden`}
                    >
                        <div className="w-full h-full perspective-1000">
                            <motion.div
                                className="relative w-full h-full"
                                initial={false}
                                whileHover={{ rotateY: 180 }}
                                transition={{
                                    duration: 1,
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
                                        src={`/api/images/${quiz.imageId}`}
                                        alt={`Quiz about ${quiz.title}`}
                                        className="w-full h-full object-cover rounded-lg" />
                                </motion.div>

                                {/* Back - Stats */}
                                <motion.div
                                    className="absolute w-full h-full bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm cursor-pointer"
                                    style={{
                                        backfaceVisibility: "hidden",
                                        WebkitBackfaceVisibility: "hidden",
                                        rotateY: 180
                                    }}
                                >
                                    <div className="h-full flex flex-col justify-between relative">
                                        {session?.user?.id === quiz.createdBy && (
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    handleDeleteQuiz(quiz._id);
                                                }}
                                                disabled={deletingQuizId === quiz._id}
                                                className="absolute -top-1 -right-1 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                title="Delete quiz"
                                            >
                                                <TrashIcon className="w-3.5 h-3.5" />
                                            </button>
                                        )}

                                        <div className="space-y-2">
                                            <div className="flex items-center">
                                                <span className="text-xs font-bold text-gray-900 dark:text-white">Global Attempts:</span>
                                                <span className="text-xs text-gray-600 dark:text-gray-300 ml-1">{quiz.stats?.totalAttempts ?? 0}</span>
                                            </div>

                                            {session && (
                                                <div className="space-y-2">
                                                    <div className="flex items-center">
                                                        <span className="text-xs font-bold text-gray-900 dark:text-white">Your Attempts:</span>
                                                        <span className="text-xs text-gray-600 dark:text-gray-300 ml-1">{quiz.stats?.userAttempts?.attempts ?? 0}</span>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-xs text-gray-600 dark:text-gray-300">
                                                            {quiz.stats?.userAttempts ?
                                                                `Best: ${Math.round((quiz.stats.userAttempts.bestScore * quiz.questions.length) / 100)}/${quiz.questions.length} correct`
                                                                : 'No Score yet'}
                                                        </p>
                                                        <p className="text-xs text-gray-600 dark:text-gray-300">
                                                            {quiz.stats?.userAttempts ?
                                                                `Average: ${Math.round((quiz.stats.userAttempts.averageScore * quiz.questions.length) / 100)}/${quiz.questions.length} correct`
                                                                : ''}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Stats below divider */}
                                        <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 space-y-1">
                                            <div className="flex items-center">
                                                <span className="text-xs font-bold text-gray-900 dark:text-white">Questions:</span>
                                                <span className="text-xs text-gray-600 dark:text-gray-300 ml-1">{quiz.questions.length}</span>
                                            </div>
                                            <div className="flex items-center">
                                                <span className="text-xs font-bold text-gray-900 dark:text-white">Difficulty:</span>
                                                <span className={`text-xs capitalize ml-1 ${quiz.metadata.difficulty === 'easy' ? 'text-green-500' :
                                                    quiz.metadata.difficulty === 'medium' ? 'text-yellow-500' :
                                                        'text-red-500'
                                                    }`}>
                                                    {quiz.metadata.difficulty}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            </motion.div>
                        </div>
                    </Link>
                </div>

                <div className="mt-0.5 px-1">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-bold text-black truncate max-w-[70%]">
                            {quiz.title}
                        </h2>
                        <div className="flex items-center gap-1.5 text-gray-600">
                            <div className="flex items-center gap-0.5">
                                <UserIcon className="w-3.5 h-3.5" />
                                <span className="text-xs">{quiz.stats?.uniqueUsers ?? 0}</span>
                            </div>
                            <div className="flex items-center gap-0.5">
                                <EyeIcon className="w-3.5 h-3.5" />
                                <span className="text-xs">{quiz.stats?.totalAttempts ?? 0}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-8">
            {/* My Quizzes Section */}
            {session?.user?.id && !isGlobalGridView && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <h2 className="text-xl font-bold text-black">My Quizzes</h2>
                            {myQuizzes.length > 0 && (
                                <button
                                    onClick={() => setIsCreateModalOpen(true)}
                                    className="flex items-center gap-1 px-3 py-1 bg-black text-white text-sm rounded-lg hover:bg-gray-800 transition-colors"
                                >
                                    <PlusIcon className="w-4 h-4" />
                                    <span>Create</span>
                                </button>
                            )}
                        </div>
                        {myQuizzes.length > 0 && (
                            <button
                                onClick={handleMyQuizzesViewToggle}
                                className="flex items-center gap-1 px-3 py-1 bg-black text-white text-sm rounded-lg hover:bg-gray-800 transition-colors"
                            >
                                {isMyQuizzesGridView ? 'Show Carousel' : 'View All'}
                            </button>
                        )}
                    </div>

                    <AnimatePresence mode="wait">
                        {isMyQuizzesGridView ? (
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
                                    <QuizCard key={quiz._id} quiz={quiz} isCarousel={false} />
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
                                                <QuizCard key={quiz._id} quiz={quiz} isCarousel={true} />
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
                        <button
                            onClick={handleGlobalViewToggle}
                            className="flex items-center gap-1 px-3 py-1 bg-black text-white text-sm rounded-lg hover:bg-gray-800 transition-colors"
                        >
                            {isGlobalGridView ? 'Show Carousel' : 'View All'}
                        </button>
                    </div>

                    <AnimatePresence mode="wait">
                        {isGlobalGridView ? (
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
                                    <QuizCard key={quiz._id} quiz={quiz} isCarousel={false} />
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
                                                <QuizCard key={quiz._id} quiz={quiz} isCarousel={true} />
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                                        {filteredQuizzes.map((quiz) => (
                                            <QuizCard key={quiz._id} quiz={quiz} isCarousel={false} />
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