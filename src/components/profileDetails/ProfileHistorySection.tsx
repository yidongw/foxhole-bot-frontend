import type { ProfileDetailsData, ProfileHistoryEntry } from '@/app/[locale]/(marketing)/profiles/[username]/types';
import { Calendar, Edit } from 'lucide-react';

// Display name mappings
const DISPLAY_KEY_NAMES = new Map<string, string>([
  ['profileImageUrlHttps', 'Profile Pic'],
  ['profileBannerUrl', 'Banner Pic'],
]);

// Set of fields that should display as images
const IMAGE_FIELDS = new Set([
  'profileImageUrlHttps',
  'profileBannerUrl',
]);

// Component to display Profile Field History
const ProfileHistorySection: React.FC<{ history: ProfileDetailsData['profileHistory'] }> = ({ history }) => {
  if (!history || history.length === 0) {
    return (
      <div className="px-4">
        <div className="mb-4 text-gray-500 dark:text-gray-400 text-center">
          No profile history available
        </div>
      </div>
    );
  }

  return (
    <div className="px-4">
      <div className="text-black dark:text-white">
        {history.slice(0, 10).map((entry: ProfileHistoryEntry, index: number) => {
          const displayKey = DISPLAY_KEY_NAMES.get(entry.key) || entry.key;
          const isImageField = IMAGE_FIELDS.has(entry.key);

          return (
            <div key={`${entry.key}-${entry.createdAt}`}>
              <div className="mb-4 text-sm">
                <div className="flex items-center gap-2">
                  <Edit size={16} />
                  <div>
                    Updated
                    {' '}
                    {displayKey}
                  </div>
                </div>
                <div className="my-2">
                  <div className="text-base font-medium mb-2">From:</div>
                  {isImageField && entry.from
                    ? (
                        <div
                          className={`w-full h-48 rounded-lg bg-gray-100 dark:bg-gray-800 bg-center bg-cover bg-no-repeat ${
                            entry.key === 'profileImageUrlHttps' ? 'max-w-xs' : 'max-w-2xl'
                          }`}
                          style={{ backgroundImage: `url(${entry.from})` }}
                          role="img"
                          aria-label={`Previous ${displayKey}`}
                        />
                      )
                    : (
                        <div className="text-base font-medium break-words">
                          {entry.from ? entry.from.replace(/\//g, '/\u200B') : 'N/A'}
                        </div>
                      )}
                </div>
                <div className="my-2">
                  <div className="text-base font-medium mb-2">To:</div>
                  {isImageField && entry.to
                    ? (
                        <div
                          className={`w-full h-48 rounded-lg bg-gray-100 dark:bg-gray-800 bg-center bg-cover bg-no-repeat ${
                            entry.key === 'profileImageUrlHttps' ? 'max-w-xs' : 'max-w-2xl'
                          }`}
                          style={{ backgroundImage: `url(${entry.to})` }}
                          role="img"
                          aria-label={`New ${displayKey}`}
                        />
                      )
                    : (
                        <div className="text-base font-medium break-words">
                          {entry.to ? entry.to.replace(/\//g, '/\u200B') : 'N/A'}
                        </div>
                      )}
                </div>
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                  <Calendar size={16} />
                  {new Date(entry.createdAt).toLocaleString()}
                </div>
              </div>
              {index < history.length - 1 && (
                <hr className="my-4 border-0 border-t border-gray-700 dark:border-gray-600" />
              )}
            </div>
          );
        })}
        {history.length > 10 && (
          <div className="mt-4 text-gray-500 dark:text-gray-400">
            ...and
            {' '}
            {history.length - 10}
            {' '}
            more entries
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileHistorySection;
