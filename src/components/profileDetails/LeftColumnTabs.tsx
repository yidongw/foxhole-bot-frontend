// src/components/ProfileDetailsSections/LeftColumnTabs.tsx
'use client';

import type { ProfileDetailsData } from '@/app/[locale]/(marketing)/profiles/[username]/types';
import { Skeleton } from '@/components/ui/skeleton';
import React, { useState } from 'react';
import FollowingsSection from './FollowingsSection';
import StatusHistorySection from './StatusHistorySection';

type LeftColumnTabsProps = {
  followings: ProfileDetailsData['followings'];
  statusHistory: ProfileDetailsData['statusHistory'];
  locale: string;
  isKol: boolean;
};

const tabButtonStyle = (isActive: boolean): string => (
  `px-4 py-2 text-base cursor-pointer mr-4 border-b-4 ${
    isActive
      ? 'border-orange-500 text-black dark:text-white'
      : 'border-transparent text-gray-500 dark:text-gray-400'
  }`
);

const LeftColumnTabs: React.FC<LeftColumnTabsProps> = ({ followings, statusHistory, locale, isKol }) => {
  const showFollowings = isKol && followings && followings.length > 0;
  const initialTab = showFollowings ? 'followings' : 'status';
  const [activeTab, setActiveTab] = useState<'followings' | 'status'>(initialTab);

  return (
    <div className="rounded-xl border border-gray-700 dark:border-gray-600 shadow-lg">
      <div className="mb-4 border-b border-gray-700 dark:border-gray-600">
        {showFollowings && (
          <button
            type="button"
            className={tabButtonStyle(activeTab === 'followings')}
            onClick={() => setActiveTab('followings')}
          >
            Followings
          </button>
        )}
        {statusHistory && (
          <button
            type="button"
            className={tabButtonStyle(activeTab === 'status')}
            onClick={() => setActiveTab('status')}
          >
            Status History
          </button>
        )}
      </div>

      <div>
        {activeTab === 'followings' && showFollowings && (
          <FollowingsSection followings={followings} locale={locale} />
        )}
        {activeTab === 'status' && statusHistory && (
          <StatusHistorySection history={statusHistory} />
        )}
      </div>
    </div>
  );
};

// Skeleton component for LeftColumnTabs
export const LeftColumnTabsSkeleton: React.FC = () => {
  return (
    <div className="rounded-xl border border-gray-700 dark:border-gray-600 shadow-lg">
      {/* Skeleton for Tab Bar */}
      <div className="mb-4 border-b border-gray-700 dark:border-gray-600 flex items-center">
        {/* Skeleton for potential Followings tab (simulated active) */}
        <Skeleton className="h-10 w-24 mr-4 border-b-2 border-gray-600 dark:border-gray-500" />
        {/* Skeleton for potential Status History tab */}
        <Skeleton className="h-10 w-24 mr-4" />
      </div>

      {/* Skeleton for Tab Content Area */}
      <div>
        <Skeleton className="h-48 w-full mt-4 bg-gray-800 dark:bg-gray-700" />
      </div>
    </div>
  );
};

export default LeftColumnTabs;
