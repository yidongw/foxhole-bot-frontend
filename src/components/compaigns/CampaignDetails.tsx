'use client';

import type { Campaign } from './CompaignsTable';
import type { CampaignUser } from './ParticipantsTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { fetchApi } from '@/libs/api';
import { useRouter } from '@/libs/i18nNavigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Calendar, DollarSign, Hash, Heart, Lightbulb, RefreshCw, Target, TrendingDown, TrendingUp, Users } from 'lucide-react';
import Image from 'next/image';
import React from 'react';
import ParticipantsTable from './ParticipantsTable';

// Types for the API responses
type CampaignTweet = {
  id: string;
  text: string;
  entities: {
    hashtags: any[];
    symbols: any[];
    urls: Array<{
      display_url: string;
      expanded_url: string;
      indices: number[];
      url: string;
    }>;
    user_mentions: Array<{
      id_str: string;
      indices: number[];
      name: string;
      screen_name: string;
    }>;
  };
  medias?: Array<{
    id_str: string;
    type: string;
    media_url_https: string;
    url: string;
    sizes: any;
  }>;
  favoriteCount: number;
  bookmarkCount: number;
  viewCount: number;
  quoteCount: number;
  replyCount: number;
  retweetCount: number;
  fullText: string;
  createdAt: string;
  analysis?: {
    sentiment?: number;
    originality?: number;
  };
  user: {
    id: string;
    name: string;
    screenName: string;
    description: string;
    location: string;
    website: string;
    followersCount: number;
    friendsCount: number;
    profileImageUrlHttps: string;
    profileBannerUrl: string;
    kolFollowersCount: number;
  };
};

type CampaignDetailsProps = {
  campaignName: string;
};

// Fetcher functions
async function fetchCampaignInfo(campaignName: string): Promise<Campaign> {
  const endpoint = `/api/v1/campaigns/${encodeURIComponent(campaignName)}`;
  const response = await fetchApi(endpoint);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}

async function fetchCampaignUsers(campaignName: string): Promise<CampaignUser[]> {
  const endpoint = `/api/v1/campaigns/${encodeURIComponent(campaignName)}/users`;
  const response = await fetchApi(endpoint);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}

async function fetchCampaignTweets(campaignName: string): Promise<CampaignTweet[]> {
  const endpoint = `/api/v1/campaigns/${encodeURIComponent(campaignName)}/tweets`;
  const response = await fetchApi(endpoint);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}

export default function CampaignDetails({ campaignName }: CampaignDetailsProps) {
  const router = useRouter();

  const {
    data: campaign,
    isLoading: campaignLoading,
    isError: campaignError,
    error: campaignErrorMessage,
  } = useQuery<Campaign, Error>({
    queryKey: ['campaign-info', campaignName],
    queryFn: () => fetchCampaignInfo(campaignName),
  });

  const {
    data: users = [],
    isLoading: usersLoading,
    isError: usersError,
  } = useQuery<CampaignUser[], Error>({
    queryKey: ['campaign-users', campaignName],
    queryFn: () => fetchCampaignUsers(campaignName),
  });

  const {
    data: tweets = [],
    isLoading: tweetsLoading,
    isError: tweetsError,
    refetch: refetchTweets,
  } = useQuery<CampaignTweet[], Error>({
    queryKey: ['campaign-tweets', campaignName],
    queryFn: () => fetchCampaignTweets(campaignName),
  });

  // Loading state
  if (campaignLoading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-32 bg-muted rounded" />
          <div className="h-64 bg-muted rounded" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-96 bg-muted rounded" />
            <div className="h-96 bg-muted rounded" />
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (campaignError) {
    return (
      <div className="p-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-2 mb-4 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Campaigns
        </button>
        <div className="text-red-500">
          Error loading campaign details:
          {' '}
          {campaignErrorMessage?.message || 'Unknown error'}
        </div>
      </div>
    );
  }

  if (!campaign) {
    return null;
  }

  return (
    <div className="p-4 space-y-6">
      {/* Back button */}
      <button
        type="button"
        onClick={() => router.back()}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Campaigns
      </button>

      {/* Campaign Details - Full Width on Top */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            {campaign.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Campaign Name and Basic Info */}
          <div>
            {/* Keywords */}
            <div className="mb-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
                <Hash className="w-4 h-4" />
                Keywords
              </h3>
              <div className="flex flex-wrap gap-2">
                {campaign.keywords.map(keyword => (
                  <Badge key={keyword} variant="secondary">
                    {keyword}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-6 mb-6">
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-center gap-1 text-muted-foreground mb-2">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <p className="text-2xl font-bold">{campaign.tweetCount.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Tweets</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-center gap-1 text-muted-foreground mb-2">
                  <Users className="w-4 h-4" />
                </div>
                <p className="text-2xl font-bold">{campaign.userCount.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Users</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-center gap-1 text-muted-foreground mb-2">
                  <Calendar className="w-4 h-4" />
                </div>
                <p className="text-2xl font-bold">
                  {campaign.createdAt
                    ? new Date(campaign.createdAt).toLocaleDateString()
                    : '-'}
                </p>
                <p className="text-xs text-muted-foreground">Created</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-center gap-1 text-muted-foreground mb-2">
                  <Calendar className="w-4 h-4" />
                </div>
                <p className="text-2xl font-bold">
                  {campaign.endedAt
                    ? new Date(campaign.endedAt).toLocaleDateString()
                    : 'Active'}
                </p>
                <p className="text-xs text-muted-foreground">Status</p>
              </div>
            </div>

            {/* Reward */}
            {campaign.rewardAmount && campaign.rewardTicker && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1">
                  <DollarSign className="w-4 h-4" />
                  Reward
                </h3>
                <p className="text-lg font-semibold">
                  {campaign.rewardAmount}
                  {' '}
                  {campaign.rewardTicker}
                  {campaign.rewardChain && (
                    <span className="text-muted-foreground ml-2">
                      on
                      {' '}
                      {campaign.rewardChain}
                    </span>
                  )}
                </p>
              </div>
            )}
          </div>

          {/* Bulls vs Bears Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold text-green-700 dark:text-green-400">Bulls Say</h3>
              </div>
              <p className="text-sm text-green-600 dark:text-green-300">
                Positive sentiment and bullish opinions about this campaign will appear here.
              </p>
            </div>
            <div className="p-4 border rounded-lg bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800">
              <div className="flex items-center gap-2 mb-3">
                <TrendingDown className="w-5 h-5 text-red-600" />
                <h3 className="font-semibold text-red-700 dark:text-red-400">Bears Say</h3>
              </div>
              <p className="text-sm text-red-600 dark:text-red-300">
                Negative sentiment and bearish opinions about this campaign will appear here.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bottom Section: Participants and Tweets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Top Participants */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Top Participants
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ParticipantsTable
              data={users}
              isLoading={usersLoading}
              isError={usersError}
            />
          </CardContent>
        </Card>

        {/* Right: Recent Tweets */}
        <Card className="h-fit">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Recent Tweets
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetchTweets()}
                disabled={tweetsLoading}
                className="flex items-center gap-1"
              >
                <RefreshCw className={`w-4 h-4 ${tweetsLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {tweetsLoading
              ? (
                  <div className="animate-pulse space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="flex gap-3">
                        <div className="w-8 h-8 bg-muted rounded-full flex-shrink-0" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-muted rounded w-32" />
                          <div className="h-16 bg-muted rounded" />
                          <div className="flex gap-4">
                            <div className="h-3 bg-muted rounded w-12" />
                            <div className="h-3 bg-muted rounded w-12" />
                            <div className="h-3 bg-muted rounded w-12" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              : tweetsError
                ? (
                    <p className="text-red-500 text-center py-8">Failed to load tweets</p>
                  )
                : (
                    <div className="space-y-4 max-h-[600px] overflow-y-auto">
                      {tweets.length > 0
                        ? (
                            tweets.map(tweet => (
                              <div key={tweet.id} className="border-b border-border pb-4 last:border-b-0">
                                <div className="flex items-start gap-3">
                                  <Image
                                    src={tweet.user.profileImageUrlHttps || '/default-avatar.png'}
                                    alt={tweet.user.name}
                                    width={32}
                                    height={32}
                                    className="w-8 h-8 rounded-full flex-shrink-0"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1 mb-1">
                                      <span className="font-medium text-sm truncate">
                                        {tweet.user.name}
                                      </span>
                                      <span className="text-muted-foreground text-sm">
                                        @
                                        {tweet.user.screenName}
                                      </span>
                                      <span className="text-muted-foreground text-sm">·</span>
                                      <span className="text-muted-foreground text-sm">
                                        {new Date(tweet.createdAt).toLocaleDateString()}
                                      </span>
                                    </div>
                                    <p className="text-sm mb-2 whitespace-pre-wrap">{tweet.text}</p>
                                    <div className="flex items-center gap-4 text-muted-foreground">
                                      <span className="text-xs">
                                        {tweet.favoriteCount.toLocaleString()}
                                        {' '}
                                        likes
                                      </span>
                                      <span className="text-xs">
                                        {tweet.retweetCount.toLocaleString()}
                                        {' '}
                                        retweets
                                      </span>
                                      <span className="text-xs">
                                        {tweet.replyCount.toLocaleString()}
                                        {' '}
                                        replies
                                      </span>
                                      {tweet.analysis?.sentiment !== undefined && (
                                        <TooltipProvider>
                                          <Tooltip delayDuration={0}>
                                            <TooltipTrigger asChild>
                                              <span className="text-xs flex items-center gap-1">
                                                <Heart className="w-3 h-3 text-red-500" />
                                                {tweet.analysis.sentiment}
                                                %
                                              </span>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                              <p>Sentiment Score</p>
                                            </TooltipContent>
                                          </Tooltip>
                                        </TooltipProvider>
                                      )}
                                      {tweet.analysis?.originality !== undefined && (
                                        <TooltipProvider>
                                          <Tooltip delayDuration={0}>
                                            <TooltipTrigger asChild>
                                              <span className="text-xs flex items-center gap-1">
                                                <Lightbulb className="w-3 h-3 text-yellow-500" />
                                                {tweet.analysis.originality}
                                                %
                                              </span>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                              <p>Originality Score</p>
                                            </TooltipContent>
                                          </Tooltip>
                                        </TooltipProvider>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))
                          )
                        : (
                            <p className="text-muted-foreground text-center py-8">No tweets yet</p>
                          )}
                    </div>
                  )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
