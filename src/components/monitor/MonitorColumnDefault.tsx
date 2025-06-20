import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import React, { useState } from 'react';

type MonitorColumnDefaultProps = {
  onAdd: (username: string) => void;
};

export const MonitorColumnDefault: React.FC<MonitorColumnDefaultProps> = ({ onAdd }) => {
  const [username, setUsername] = useState('');

  const handleAdd = () => {
    if (username.trim()) {
      onAdd(username.trim());
      setUsername('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAdd();
    }
  };

  return (
    <div className="flex flex-col h-full shadow overflow-hidden min-w-0 border-l-3 border-r-3 bg-white dark:bg-gray-800">
      <div className="flex-1 h-0 min-w-0 flex flex-col justify-center items-center p-4">
        <div className="flex flex-col items-center space-y-4">
          <Input
            placeholder="Enter Twitter username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            onKeyPress={handleKeyPress}
            className="w-48"
          />
          <Button onClick={handleAdd} className="w-48">Add column</Button>
        </div>
      </div>
    </div>
  );
};
