'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bars3Icon, XMarkIcon, BookmarkIcon, ClockIcon } from '@heroicons/react/24/outline';
import BookmarkModal from './BookmarkModal';
import AttemptHistoryModal from './AttemptHistoryModal';

export default function Sidebar() {
    const [isCollapsed, setIsCollapsed] = useState(true);
    const [isBookmarkModalOpen, setIsBookmarkModalOpen] = useState(false);
    const [isAttemptHistoryModalOpen, setIsAttemptHistoryModalOpen] = useState(false);

    const sidebarContent = (
        <div className="flex flex-col h-full">
            {/* Top section with collapse button only */}
            <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-center">
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
                <div className={`px-4 py-6 ${isCollapsed ? 'flex flex-col items-center gap-4' : ''}`}>
                    <button
                        onClick={() => setIsBookmarkModalOpen(true)}
                        className={`flex items-center gap-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors ${isCollapsed ? 'p-1.5 w-auto' : 'px-3 py-2 w-full mb-4'}`}
                    >
                        <BookmarkIcon className={`${isCollapsed ? 'w-6 h-6' : 'w-4 h-4'} text-gray-500`} />
                        {!isCollapsed && "Bookmarks"}
                    </button>
                    <button
                        onClick={() => setIsAttemptHistoryModalOpen(true)}
                        className={`flex items-center gap-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors ${isCollapsed ? 'p-1.5 w-auto' : 'px-3 py-2 w-full'}`}
                    >
                        <ClockIcon className={`${isCollapsed ? 'w-6 h-6' : 'w-4 h-4'} text-gray-500`} />
                        {!isCollapsed && "Recent Attempts"}
                    </button>
                </div>
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

            {/* Attempt History Modal */}
            <AttemptHistoryModal
                isOpen={isAttemptHistoryModalOpen}
                onClose={() => setIsAttemptHistoryModalOpen(false)}
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