import type { ProfileDetailsData, ProfileHistoryEntry } from '@/app/[locale]/(marketing)/profiles/[username]/types';
import { Calendar, Edit } from 'lucide-react';

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
        {history.slice(0, 10).map((entry: ProfileHistoryEntry, index: number) => (
          <div key={`${entry.key}-${entry.createdAt}`}>
            <div className="mb-4 text-sm">
              <div className="flex items-center gap-2">
                <Edit size={16} />
                <div>
                  Updated
                  {' '}
                  {entry.key}
                </div>
              </div>
              <div className="my-2 text-base font-medium break-words">
                From:
                {' '}
                {entry.from ? entry.from.replace(/\//g, '/\u200B') : 'N/A'}
              </div>
              <div className="my-2 text-base font-medium break-words">
                To:
                {' '}
                {entry.to ? entry.to.replace(/\//g, '/\u200B') : 'N/A'}
              </div>
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                <Calendar size={16} />
                {new Date(entry.createdAt).toLocaleDateString()}
              </div>
            </div>
            {index < history.length - 1 && (
              <hr className="my-4 border-0 border-t border-gray-700 dark:border-gray-600" />
            )}
          </div>
        ))}
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
