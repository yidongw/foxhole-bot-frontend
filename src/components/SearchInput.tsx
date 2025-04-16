'use client';

import type { KeyboardEvent, MouseEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

export const SearchInput = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleSearch = (e?: MouseEvent) => {
    const query = searchQuery.trim();
    if (query) {
      // Check if command/ctrl key is pressed
      if (e?.metaKey || e?.ctrlKey) {
        window.open(`/profiles/${query}`, '_blank');
      } else {
        router.push(`/profiles/${query}`);
      }
      setSearchQuery('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      // Check if command/ctrl key is pressed
      if (e.metaKey || e.ctrlKey) {
        window.open(`/profiles/${searchQuery.trim()}`, '_blank');
        setSearchQuery('');
      } else {
        handleSearch();
      }
    }
  };

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: globalThis.MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center">
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search profiles..."
          className="w-[200px] px-3 py-1.5 pr-10 rounded-lg border border-gray-300 dark:border-gray-600
                     bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                     focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400
                     placeholder:text-gray-500 dark:placeholder:text-gray-400 text-sm"
        />
        <Button
          onClick={e => handleSearch(e as MouseEvent)}
          variant="ghost"
          size="icon"
          className="absolute right-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md h-7 w-7"
        >
          <Search className="h-4 w-4 text-gray-500 dark:text-gray-400" />
        </Button>
      </div>
    </div>
  );
};
