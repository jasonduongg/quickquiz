'use client';

import { useState } from 'react';
import QuizList from './components/QuizList';
import CreateQuizButton from '../components/CreateQuizButton';
import Navbar from './components/Navbar';
import SearchBar from './components/SearchBar';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-6">
          <SearchBar onSearch={handleSearch} />
        </div>
        <div className="py-6">
          <QuizList searchQuery={searchQuery} />
        </div>
      </div>
      <CreateQuizButton />
    </div>
  );
}
