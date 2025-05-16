'use client';

import { useState } from 'react';
import QuizList from './components/QuizList';
import Navbar from './components/Navbar';
import SearchBar from './components/SearchBar';
import Sidebar from './components/Sidebar';
import { useSidebar } from './contexts/SidebarContext';
import { SidebarProvider } from './contexts/SidebarContext';

function MainContent() {
  const [searchQuery, setSearchQuery] = useState('');
  const { isCollapsed } = useSidebar();

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  return (
    <div className="min-h-screen bg-offwhite flex">
      <Sidebar />
      <div
        className={`flex-1 transition-[margin] duration-300 ease-in-out ${isCollapsed ? 'ml-[60px]' : 'ml-[240px]'}`}
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