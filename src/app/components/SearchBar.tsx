'use client';

import { useState, useCallback, useEffect } from 'react';
import { useDebounce } from '@/lib/hooks/useDebounce';

interface SearchBarProps {
    onSearch: (query: string) => void;
}

export default function SearchBar({ onSearch }: SearchBarProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearchQuery = useDebounce(searchQuery, 300);

    useEffect(() => {
        onSearch(debouncedSearchQuery);
    }, [debouncedSearchQuery, onSearch]);

    const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
    }, []);

    return (
        <div className="w-[400px]">
            <div className="relative">
                <input
                    type="text"
                    placeholder="Search quizzes..."
                    value={searchQuery}
                    onChange={handleSearch}
                    className="w-full px-3 py-1.5 text-sm rounded-lg bg-white border border-gray-300 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-transparent"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-2.5">
                    <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
            </div>
        </div>
    );
} 