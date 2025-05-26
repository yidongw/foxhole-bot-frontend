'use client';

import { fetchApi } from '@/libs/api';
import { Env } from '@/libs/Env';
import { Turnstile } from 'next-turnstile';
import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

type TurnstileChallengeProps = {
  siteKey: string;
  onSuccess: (token: string) => void;
};

export default function TurnstileChallenge({ siteKey, onSuccess }: TurnstileChallengeProps) {
  const [refreshKey, setRefreshKey] = useState(() => uuidv4());
  const [isValidating, setIsValidating] = useState(false);
  // Track if we should force a complete remount of the Turnstile component
  const [, setForceRemount] = useState(0);

  const handleExpired = () => {
    // Generate a new key and increment remount counter to force a complete reset
    setRefreshKey(uuidv4());
    setForceRemount(prev => prev + 1);
  };

  const handleError = () => {
    // Generate a new key and increment remount counter to force a complete reset
    setRefreshKey(uuidv4());
    setForceRemount(prev => prev + 1);
  };

  const validateToken = async (token: string) => {
    setIsValidating(true);
    try {
      const response = await fetchApi(`${Env.NEXT_PUBLIC_API_HOST}/api/v1/turnstile/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });
      const data = await response.json();
      if (data.success) {
        onSuccess(data.token);
      } else {
        // If validation fails, refresh the challenge
        handleExpired();
      }
    } catch {
      // If there's an error, refresh the challenge
      handleExpired();
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-sm">
        <h1 className="mb-6 text-center text-2xl font-bold">Security Check</h1>
        <p className="mb-6 text-center text-muted-foreground">
          Please complete the security challenge to continue.
        </p>
        <div className="flex justify-center">
          <Turnstile
            // key={`turnstile-${forceRemount}`}
            id={refreshKey}
            siteKey={siteKey}
            retry="auto"
            // refreshExpired="auto"
            // sandbox={true}
            onVerify={(token) => {
              if (token) {
                validateToken(token);
              }
            }}
            onError={handleError}
            onExpire={handleExpired}
            theme="auto"
          />
        </div>
        {isValidating && (
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Validating...
          </p>
        )}
      </div>
    </div>
  );
}
