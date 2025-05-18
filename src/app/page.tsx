'use client';

import { useState } from 'react';
import QuizList from './components/QuizList';
import Navbar from './components/Navbar';
import SearchBar from './components/SearchBar';
import Sidebar from './components/Sidebar';
import { SidebarProvider } from './contexts/SidebarContext';
import { useSession } from 'next-auth/react';

function MainContent() {
  const [searchQuery, setSearchQuery] = useState('');
  const { data: session } = useSession();

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  return (
    <div className="min-h-screen bg-offwhite flex font-telegraf">
      {session && <Sidebar />}
      <div
        className={`flex-1 transition-[margin] duration-300 ease-in-out`}
      >
        <div className="h-full flex flex-col">
          <Navbar />
          <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <div className="py-6">
              <SearchBar onSearch={handleSearch} />
            </div>
            <div className="py-6">
              <QuizList searchQuery={searchQuery} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <SidebarProvider>
      <MainContent />
    </SidebarProvider>
  );
}