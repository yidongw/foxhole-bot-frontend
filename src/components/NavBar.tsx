import { Compass, Users } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { SearchInput } from './SearchInput';
import { ThemeSwitcher } from './ThemeSwitcher';

export const NavBar = () => (
  <div className="sticky top-0 z-50 bg-gray-100 dark:bg-gray-900 p-4 border-b border-gray-200 dark:border-gray-800">
    <div className="mx-auto max-w-screen-lg flex items-center justify-between">
      <Image
        src="/foxhole.jpg"
        alt="Foxhole Bot Logo"
        width={32}
        height={32}
      />
      <Link href="/discover" className="flex items-center gap-2 hover:opacity-80">
        <Compass className="w-4 h-4" />
        <span className="hidden sm:inline">Discover</span>
      </Link>

      <Link href="/profiles" className="flex items-center gap-2 hover:opacity-80">
        <Users className="w-4 h-4" />
        <span className="hidden sm:inline">Profiles</span>
      </Link>
      <div className="flex items-center gap-2">
        <SearchInput />
        <ThemeSwitcher />
      </div>
    </div>
  </div>
);
