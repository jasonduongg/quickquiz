import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, ClockIcon } from '@heroicons/react/24/solid';
import AttemptHistory from './AttemptHistory';

interface AttemptHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function AttemptHistoryModal({ isOpen, onClose }: AttemptHistoryModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop with blur */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 min-h-[100dvh] bg-black/20 backdrop-blur-sm z-40"
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
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-white rounded-xl shadow-lg z-50 p-4"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <ClockIcon className="w-5 h-5 text-blue-600" />
                                <h2 className="text-lg font-bold text-gray-900">Recent Attempts</h2>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <XMarkIcon className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        <div className="relative h-[500px]">
                            <AttemptHistory />
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
} 