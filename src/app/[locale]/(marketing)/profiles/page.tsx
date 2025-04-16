// Remove 'use client' directive

// Import the new client component
import ProfileList from '@/components/ProfileList'; // Adjust path if needed
// Remove useQuery import
import { getTranslations } from 'next-intl/server'; // Keep for metadata
import React from 'react';

// Keep ProfilePageProps type
type ProfilePageProps = {
  params: Promise<{ locale: string }>;
};

// Keep generateMetadata as it is
export async function generateMetadata({ params }: ProfilePageProps) {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: 'Profiles',
  });

  return {
    title: t('meta_title'),
    description: t('meta_description'),
  };
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { locale } = await params;
  // Remove setRequestLocale call
  // Remove useQuery hook and related logic

  // Render the client component, passing the locale
  return <ProfileList locale={locale} />;
}
