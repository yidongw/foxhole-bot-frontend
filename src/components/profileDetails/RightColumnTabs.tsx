'use client';

import type { ProfileDetailsData } from '@/app/[locale]/(marketing)/profiles/[username]/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Coins, History, Users } from 'lucide-react';
import React, { useState } from 'react';
import PastUsernamesSection from './PastUsernamesSection';
import ProfileHistorySection from './ProfileHistorySection';
import UserCasSection from './UserCasSection';

type RightBottomTabsProps = {
  profileHistory: ProfileDetailsData['profileHistory'];
  pastUsernames: ProfileDetailsData['pastUsernames'];
  userCas: ProfileDetailsData['userCas'];
};

type TabId = 'contracts' | 'profile' | 'usernames';

const tabButtonStyle = (isActive: boolean): string => (
  `p-2 w-[70px] flex items-center justify-center gap-2 cursor-pointer mr-2 border-b-2 transition-all duration-200 ${
    isActive
      ? 'border-orange-500 text-black dark:text-white'
      : 'border-transparent text-gray-500 dark:text-gray-400'
  }`
);

const badgeStyle = 'bg-gray-600 dark:bg-gray-700 text-gray-200 dark:text-gray-300 rounded-full px-2 py-0.5 text-xs ml-1 align-middle';

const RightColumnTabs: React.FC<RightBottomTabsProps> = ({ profileHistory, pastUsernames, userCas }) => {
  const initialTab: TabId = 'contracts';
  const [activeTab, setActiveTab] = useState<TabId>(initialTab);

  return (
    <div className="rounded-xl border border-gray-700 dark:border-gray-600 shadow-lg">
      <TooltipProvider delayDuration={0}>
        <div className="mb-4 border-b border-gray-700 dark:border-gray-600 flex min-w-[240px]">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className={tabButtonStyle(activeTab === 'contracts')}
                onClick={() => setActiveTab('contracts')}
              >
                <Coins size={18} />
                <span className={badgeStyle}>{userCas?.length || 0}</span>
              </button>
            </TooltipTrigger>
            <TooltipContent>Token Contracts</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className={tabButtonStyle(activeTab === 'profile')}
                onClick={() => setActiveTab('profile')}
              >
                <History size={18} />
                <span className={badgeStyle}>{profileHistory?.length || 0}</span>
              </button>
            </TooltipTrigger>
            <TooltipContent>Profile Updates</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className={tabButtonStyle(activeTab === 'usernames')}
                onClick={() => setActiveTab('usernames')}
              >
                <Users size={18} />
                <span className={badgeStyle}>{pastUsernames?.length || 0}</span>
              </button>
            </TooltipTrigger>
            <TooltipContent>Past Usernames</TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>

      <div>
        {activeTab === 'contracts' && (
          <UserCasSection cas={userCas || []} />
        )}
        {activeTab === 'profile' && (
          <ProfileHistorySection history={profileHistory || []} />
        )}
        {activeTab === 'usernames' && (
          <PastUsernamesSection usernames={pastUsernames || []} />
        )}
      </div>
    </div>
  );
};

// Skeleton component for RightColumnTabs
export const RightColumnTabsSkeleton: React.FC = () => {
  return (
    <div className="rounded-xl border border-gray-700 dark:border-gray-600 shadow-lg">
      {/* Skeleton for Tab Bar */}
      <div className="mb-4 border-b border-gray-700 dark:border-gray-600 flex min-w-[240px]">
        {/* Skeleton for Contracts Tab (simulated active) */}
        <div className="h-11 w-[70px] mr-2 flex items-center justify-center gap-1 rounded-t-md border-b-2 border-gray-600 dark:border-gray-500">
          <Skeleton className="h-[18px] w-[18px] bg-gray-600 dark:bg-gray-700 rounded" />
          <Skeleton className="h-4 w-6 bg-gray-600 dark:bg-gray-700 rounded-full" />
        </div>
        {/* Skeleton for Profile Tab */}
        <div className="h-11 w-[70px] mr-2 flex items-center justify-center gap-1 rounded-t-md">
          <Skeleton className="h-[18px] w-[18px] bg-gray-600 dark:bg-gray-700 rounded" />
          <Skeleton className="h-4 w-6 bg-gray-600 dark:bg-gray-700 rounded-full" />
        </div>
        {/* Skeleton for Usernames Tab */}
        <div className="h-11 w-[70px] mr-2 flex items-center justify-center gap-1 rounded-t-md">
          <Skeleton className="h-[18px] w-[18px] bg-gray-600 dark:bg-gray-700 rounded" />
          <Skeleton className="h-4 w-6 bg-gray-600 dark:bg-gray-700 rounded-full" />
        </div>
      </div>

      {/* Skeleton for Tab Content Area */}
      <div>
        <Skeleton className="h-[150px] w-full mt-4 bg-gray-800 dark:bg-gray-700" />
      </div>
    </div>
  );
};

export default RightColumnTabs;
