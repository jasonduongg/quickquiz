import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { EyeIcon, TrashIcon, UserIcon, BookmarkIcon as BookmarkOutlineIcon } from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/24/solid';
import SignInModal from './SignInModal';

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

interface QuizCardProps {
    quiz: Quiz;
    isCarousel?: boolean;
    onDelete?: (quizId: string) => Promise<void>;
    onBookmarkToggle?: (quizId: string, currentBookmarkState: boolean) => Promise<void>;
    deletingQuizId?: string | null;
    bookmarkingQuizId?: string | null;
}

export const QuizCard = ({
    quiz,
    isCarousel = false,
    onDelete,
    onBookmarkToggle,
    deletingQuizId,
    bookmarkingQuizId
}: QuizCardProps) => {
    const { data: session } = useSession();
    const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);

    const handleQuizClick = (e: React.MouseEvent) => {
        if (!session) {
            e.preventDefault();
            setIsSignInModalOpen(true);
        }
    };

    return (
        <div className={`flex flex-col ${isCarousel ? 'min-w-[280px] w-[280px]' : 'w-full'}`}>
            <div className="relative w-full">
                <Link
                    href={`/quiz/${quiz._id}`}
                    onClick={handleQuizClick}
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
                                <div className="relative w-full h-full">
                                    <Image
                                        src={`/api/images/${quiz.imageId}`}
                                        alt={`Quiz about ${quiz.title}`}
                                        fill
                                        sizes={isCarousel ? "280px" : "(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"}
                                        className="object-cover rounded-lg"
                                        priority={false}
                                    />
                                </div>
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
                                    <div className="absolute -top-1 -right-1 flex gap-1">
                                        {session?.user?.id === quiz.createdBy && onDelete && (
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    onDelete(quiz._id);
                                                }}
                                                disabled={deletingQuizId === quiz._id}
                                                className="p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                title="Delete quiz"
                                            >
                                                <TrashIcon className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                        {session?.user?.id && onBookmarkToggle && (
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    onBookmarkToggle(quiz._id, quiz.isBookmarked || false);
                                                }}
                                                disabled={bookmarkingQuizId === quiz._id}
                                                className={`p-1.5 rounded-full shadow-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${quiz.isBookmarked
                                                    ? 'bg-yellow-400 hover:bg-yellow-500 text-white'
                                                    : 'bg-white hover:bg-gray-100 text-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300'
                                                    }`}
                                                title={quiz.isBookmarked ? "Remove bookmark" : "Bookmark quiz"}
                                            >
                                                {quiz.isBookmarked ? (
                                                    <BookmarkSolidIcon className="w-3.5 h-3.5" />
                                                ) : (
                                                    <BookmarkOutlineIcon className="w-3.5 h-3.5" />
                                                )}
                                            </button>
                                        )}
                                    </div>

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

            <SignInModal
                isOpen={isSignInModalOpen}
                onClose={() => setIsSignInModalOpen(false)}
            />
        </div>
    );
};

export const QuizCardSkeleton = ({ isCarousel = false }: { isCarousel?: boolean }) => (
    <div className={`flex flex-col ${isCarousel ? 'min-w-[280px] w-[280px]' : 'w-full'}`}>
        <div className="relative w-full">
            <div className={`${isCarousel ? 'h-[200px]' : 'aspect-[4/3]'} rounded-lg overflow-hidden bg-gray-200 animate-pulse`} />
        </div>
        <div className="mt-2 px-1">
            <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4 mb-1" />
            <div className="flex items-center gap-2">
                <div className="h-3 bg-gray-200 rounded animate-pulse w-8" />
                <div className="h-3 bg-gray-200 rounded animate-pulse w-8" />
            </div>
        </div>
    </div>
);

export const CarouselSkeleton = () => (
    <div className="relative h-[220px]">
        <div className="flex gap-3 overflow-x-hidden absolute inset-0">
            {[1, 2, 3, 4].map((i) => (
                <QuizCardSkeleton key={i} isCarousel={true} />
            ))}
        </div>
    </div>
);

export const GridSkeleton = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
            <QuizCardSkeleton key={i} />
        ))}
    </div>
); 