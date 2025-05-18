'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bars3Icon, XMarkIcon, BookmarkIcon } from '@heroicons/react/24/outline';
import AttemptHistory from './AttemptHistory';
import BookmarkModal from './BookmarkModal';

export default function Sidebar() {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isBookmarkModalOpen, setIsBookmarkModalOpen] = useState(false);

    const sidebarContent = (
        <div className="flex flex-col h-full">
            {/* Top section with bookmark button */}
            <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                    {!isCollapsed && (
                        <button
                            onClick={() => setIsBookmarkModalOpen(true)}
                            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <BookmarkIcon className="w-5 h-5" />
                            Bookmarks
                        </button>
                    )}
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        {isCollapsed ? (
                            <Bars3Icon className="w-6 h-6 text-gray-500" />
                        ) : (
                            <XMarkIcon className="w-6 h-6 text-gray-500" />
                        )}
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto">
                {!isCollapsed && (
                    <div className="px-4 py-6">
                        <AttemptHistory />
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <>
            <motion.aside
                className="fixed top-0 left-0 h-full bg-white border-r border-gray-200 z-30"
                animate={{ width: isCollapsed ? "64px" : "320px" }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
                {sidebarContent}
            </motion.aside>

            {/* Bookmark Modal */}
            <BookmarkModal
                isOpen={isBookmarkModalOpen}
                onClose={() => setIsBookmarkModalOpen(false)}
            />

            {/* Main content margin adjustment */}
            <motion.div
                className="min-h-screen bg-gray-50"
                animate={{ marginLeft: isCollapsed ? "64px" : "320px" }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
                {/* ... rest of the main content ... */}
            </motion.div>
        </>
    );
} 