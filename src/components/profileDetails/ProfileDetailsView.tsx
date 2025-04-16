'use client';

import type { ProfileDetailsData } from '@/app/[locale]/(marketing)/profiles/[username]/types';
import type { ProfileData } from '@/components/ProfileCard';
import ProfileCard, { ProfileCardSkeleton } from '@/components/ProfileCard';
import LeftColumnTabs, { LeftColumnTabsSkeleton } from '@/components/profileDetails/LeftColumnTabs';
import RightColumnTabs, { RightColumnTabsSkeleton } from '@/components/profileDetails/RightColumnTabs';
import { useQuery } from '@tanstack/react-query';
import React from 'react';

// --- Fetcher Function ---
// (Can be kept here or moved to a separate utils/api file)
async function fetchProfileDetails(username: string): Promise<ProfileDetailsData | null> {
  // Use relative path or environment variable for API host
  const response = await fetch(`/api/v1/profiles/${username}`);

  if (!response.ok) {
    if (response.status === 404) {
      return null; // Indicate not found
    }
    // Throw an error for other non-ok statuses to be caught by react-query
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  try {
    const data = await response.json();
    return data;
  } catch (e) {
    console.error('Failed to parse profile details JSON:', e);
    throw new Error('Invalid data received from server.');
  }
}

// --- Component Props ---
type ProfileDetailsViewProps = {
  username: string;
  locale: string;
};

// --- Client Component ---
export default function ProfileDetailsView({ username, locale }: ProfileDetailsViewProps) {
  const {
    data: profileData,
    isLoading,
    isError,
    error,
  } = useQuery<ProfileDetailsData | null, Error>({
    queryKey: ['profileDetails', username], // Include username in the key
    queryFn: () => fetchProfileDetails(username),
    // Optional: configuration like staleTime, retry, etc.
    // staleTime: 5 * 60 * 1000, // 5 minutes
    // retry: 1, // Retry once on error
  });

  // --- Loading State ---
  if (isLoading) {
    return (
      <div>
        {/* Skeleton for Profile Card */}
        <ProfileCardSkeleton />

        {/* Skeleton for Two-Column Layout */}
        <div className="mt-8 flex flex-col-reverse md:flex-row gap-8">
          {/* Left Column Skeleton */}
          <div className="w-full md:flex-2">
            <LeftColumnTabsSkeleton />
          </div>
          {/* Right Column Skeleton */}
          <div className="w-full md:flex-1">
            <RightColumnTabsSkeleton />
          </div>
        </div>
      </div>
    );
  }

  // --- Error State ---
  if (isError) {
    console.error('Error loading profile details:', error);
    return (
      <div className="p-4 text-red-500">
        Error loading profile:
        {' '}
        {error?.message || 'Unknown error'}
      </div>
    );
  }

  // --- Not Found State (after loading, data is null) ---
  if (profileData === null) {
    return <div className="p-4 text-orange-400">Profile cannot be found.</div>;
  }

  // --- Success State (profileData is guaranteed to be ProfileDetailsData here) ---
  // Explicit check just for type safety, though null is handled above
  if (!profileData) {
    // This should technically not be reached if null triggers notFound()
    return <div className="p-4 text-orange-400">Profile data is unexpectedly missing.</div>;
  }

  return (
    <div>
      {/* Top Profile Card */}
      {/* We cast profileData to ProfileData as ProfileCard expects the base type */}
      <ProfileCard profile={profileData as ProfileData} locale={locale} />

      {/* Responsive Two-Column Layout Container */}
      <div className="mt-8 flex flex-col-reverse md:flex-row gap-8">
        {/* Left Column */}
        <div className="w-full md:flex-2">
          <LeftColumnTabs
            followings={profileData.followings}
            statusHistory={profileData.statusHistory}
            locale={locale}
            isKol={profileData.isKol ?? false}
          />
        </div>

        {/* Right Column */}
        <div className="w-full md:flex-1">
          <RightColumnTabs
            profileHistory={profileData.profileHistory}
            pastUsernames={profileData.pastUsernames}
            userCas={profileData.userCas}
          />
        </div>
      </div>
    </div>
  );
}
