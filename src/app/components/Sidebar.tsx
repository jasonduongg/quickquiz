'use client';

import { motion } from 'framer-motion';
import { useSidebar } from '../contexts/SidebarContext';
import { ChevronDoubleLeftIcon, ChevronDoubleRightIcon } from '@heroicons/react/24/outline';

export default function Sidebar() {
    const { isCollapsed, setIsCollapsed } = useSidebar();

    const sidebarContent = (
        <div className="flex flex-col h-full">
            {/* Collapse Button */}
            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-center border-b border-gray-200"
                title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
                {isCollapsed ? (
                    <ChevronDoubleRightIcon className="w-5 h-5 text-gray-600" />
                ) : (
                    <ChevronDoubleLeftIcon className="w-5 h-5 text-gray-600" />
                )}
            </button>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto">
                {!isCollapsed && (
                    <div className="px-4 py-6">
                        {/* Add your sidebar content here */}
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <motion.div
            initial={false}
            animate={{ width: isCollapsed ? "60px" : "240px" }}
            className="fixed left-0 top-0 h-screen bg-white border-r border-gray-200 shadow-sm z-10"
        >
            {sidebarContent}
        </motion.div>
    );
} 