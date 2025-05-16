'use client';

import { useState } from 'react';
import CreateQuizModal from './CreateQuizModal';

export default function CreateQuizButton() {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setIsModalOpen(true)}
                className="fixed bottom-8 right-8 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center text-2xl font-bold transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                aria-label="Create new quiz"
            >
                +
            </button>

            <CreateQuizModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onQuizCreated={() => {
                    // You can add any additional logic here after quiz creation
                }}
            />
        </>
    );
} 