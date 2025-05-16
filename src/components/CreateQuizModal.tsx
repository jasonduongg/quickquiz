'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface CreateQuizModalProps {
    isOpen: boolean;
    onClose: () => void;
    onQuizCreated: () => void;
}

export default function CreateQuizModal({ isOpen, onClose, onQuizCreated }: CreateQuizModalProps) {
    const router = useRouter();
    const [prompt, setPrompt] = useState('');
    const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
    const [numQuestions, setNumQuestions] = useState(5);
    const [additionalContext, setAdditionalContext] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/quizzes/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompt,
                    difficulty,
                    numQuestions,
                    additionalContext: additionalContext.trim() || undefined
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to create quiz');
            }

            const data = await response.json();
            onQuizCreated();
            onClose();
            // Use Next.js router for navigation
            router.push(`/quiz/${data.quizId}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-lg w-full mx-4">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Create New Quiz</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Topic or Prompt
                        </label>
                        <textarea
                            id="prompt"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="e.g., 'World War II' or 'Python Programming Basics'"
                            className="w-full h-24 p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Difficulty
                            </label>
                            <select
                                id="difficulty"
                                value={difficulty}
                                onChange={(e) => setDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
                                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                            >
                                <option value="easy">Easy</option>
                                <option value="medium">Medium</option>
                                <option value="hard">Hard</option>
                            </select>
                        </div>

                        <div>
                            <label htmlFor="numQuestions" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Number of Questions
                            </label>
                            <input
                                type="number"
                                id="numQuestions"
                                value={numQuestions}
                                onChange={(e) => setNumQuestions(Math.min(20, Math.max(1, parseInt(e.target.value) || 5)))}
                                min="1"
                                max="20"
                                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="additionalContext" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Additional Context (Optional)
                        </label>
                        <textarea
                            id="additionalContext"
                            value={additionalContext}
                            onChange={(e) => setAdditionalContext(e.target.value)}
                            placeholder="e.g., 'Focus on Python 3.x features' or 'Include questions about major battles'"
                            className="w-full h-20 p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        />
                    </div>

                    {error && (
                        <div className="text-red-500 text-sm">{error}</div>
                    )}

                    <div className="flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading || !prompt.trim()}
                            className={`px-4 py-2 rounded-lg text-white font-medium ${isLoading || !prompt.trim()
                                ? 'bg-blue-400 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-700'
                                }`}
                        >
                            {isLoading ? 'Creating...' : 'Create Quiz'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
} 