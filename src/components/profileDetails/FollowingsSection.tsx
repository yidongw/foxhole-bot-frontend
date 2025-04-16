import type { FollowingEntry } from '@/app/[locale]/(marketing)/profiles/[username]/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import React from 'react';

// Component for Followings (Example: List of simple cards)
const FollowingsSection: React.FC<{ followings: FollowingEntry[]; locale: string }> = ({ followings, locale }) => {
  return (
    <div className="px-4 pb-4">
      <TooltipProvider>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>Profile</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="text-right">Followers</TableHead>
              <TableHead className="text-right">Key Followers</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {followings.map(following => (
              <TableRow key={following.followeeScreenName}>
                <TableCell className="text-sm text-muted-foreground">
                  {following.createdAt ? new Date(following.createdAt).toLocaleDateString() : '-'}
                </TableCell>
                <TableCell>
                  {(following.followeeProfileImageUrl && following.followeeProfileImageUrl !== 'undefined')
                    ? (
                        <div
                          className="w-8 h-8 rounded-full bg-cover bg-center"
                          style={{ backgroundImage: `url(${following.followeeProfileImageUrl})` }}
                        />
                      )
                    : (
                        <div className="w-8 h-8 rounded-full bg-muted" />
                      )}
                </TableCell>
                <TableCell>
                  {following.followeeScreenName
                    ? (
                        <Tooltip delayDuration={0}>
                          <TooltipTrigger asChild>
                            <a
                              href={`/${locale}/profiles/${following.followeeScreenName}`}
                              className="text-black dark:text-white hover:underline"
                            >
                              {following.followeeName || following.followeeId}
                            </a>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div>
                              <div className="font-medium">
                                @
                                {following.followeeScreenName}
                              </div>
                              {following.followeeDescription && (
                                <div className="text-sm text-muted-foreground mt-1">
                                  {following.followeeDescription}
                                </div>
                              )}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      )
                    : (
                        <span className="text-black dark:text-white">
                          {following.followeeName || following.followeeId}
                        </span>
                      )}
                </TableCell>
                <TableCell className="text-right text-black dark:text-white">
                  {following.followeeFollowers ? following.followeeFollowers.toLocaleString() : '-'}
                </TableCell>
                <TableCell className="text-right text-black dark:text-white">
                  {following.followeeKeyFollowers ? following.followeeKeyFollowers.toLocaleString() : '-'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TooltipProvider>
    </div>
  );
};

export default FollowingsSection;
