import { Activity, Compass, Megaphone, Users } from 'lucide-react';
import Image from 'next/image';
import { NavLink } from './NavLink';
import { ThemeSwitcher } from './ThemeSwitcher';

export const NavBar = () => (
  <div className="sticky top-0 z-50 dark:bg-gray-900 p-4 border-gray-200 dark:border-gray-800">
    <div className="mx-auto max-w-[90vw] flex items-center justify-between">
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-2 mr-4">
          <Image
            src="/foxhole.jpg"
            alt="Foxhole Bot Logo"
            width={32}
            height={32}
          />
          <div className="text-lg font-bold">
            Foxhole
          </div>
        </div>
        <NavLink href="/" default>
          <Activity className="w-4 h-4" />
          <span className="hidden sm:inline">Monitor</span>
        </NavLink>

        <NavLink href="/discover">
          <Compass className="w-4 h-4" />
          <span className="hidden sm:inline">Discover</span>
        </NavLink>

        <NavLink href="/profiles">
          <Users className="w-4 h-4" />
          <span className="hidden sm:inline">Profiles</span>
        </NavLink>

        <NavLink href="/campaigns">
          <Megaphone className="w-4 h-4" />
          <span className="hidden sm:inline">Campaigns</span>
        </NavLink>
      </div>

      <div className="flex items-center gap-4">
        {/* <SearchInput /> */}
        <ThemeSwitcher />
        {/* <StatusIndicator /> */}
      </div>
    </div>
  </div>
);
