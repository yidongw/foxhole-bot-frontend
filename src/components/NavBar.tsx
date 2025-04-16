import Image from 'next/image';
import { SearchInput } from './SearchInput';
import { ThemeSwitcher } from './ThemeSwitcher';

export const NavBar = () => (
  <div className="sticky top-0 z-50 bg-gray-100 dark:bg-gray-900 p-4 border-b border-gray-200 dark:border-gray-800">
    <div className="mx-auto max-w-screen-lg flex items-center">
      <Image
        src="/foxhole.jpg"
        alt="Foxhole Bot Logo"
        width={32}
        height={32}
        className="mr-2"
      />
      <div className="ml-auto flex items-center gap-2">
        <SearchInput />
        <ThemeSwitcher />
      </div>
    </div>
  </div>
);
