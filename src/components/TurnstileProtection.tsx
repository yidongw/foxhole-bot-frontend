'use client';

import { fetchApi } from '@/libs/api';
import { Env } from '@/libs/Env';
import { useAuthStore } from '@/store/authStore';
import { useEffect } from 'react';
import TurnstileChallenge from './TurnstileChallenge';

type TurnstileProtectionProps = {
  siteKey: string;
  children: React.ReactNode;
};

export default function TurnstileProtection({ siteKey, children }: TurnstileProtectionProps) {
  const { token, setToken } = useAuthStore();

  // Check with the server if the user is verified on mount
  useEffect(() => {
    const checkVerification = async () => {
      try {
        const options: RequestInit = {};

        // Include token in request body if available
        if (token) {
          options.method = 'POST';
          options.headers = {
            'Content-Type': 'application/json',
          };
          options.body = JSON.stringify({ token });
        }

        const response = await fetchApi(`${Env.NEXT_PUBLIC_API_HOST}/api/v1/turnstile/check`, options);
        const data = await response.json();

        if (!data.success) {
          setToken(null);
        }
      } catch {
        // If there's an error, default to not verified
        setToken(null);
      }
    };

    checkVerification();
  }, [setToken, token]);

  const handleSuccess = (token: string) => {
    setToken(token);
  };

  // Show the children content if user is verified
  if (token) {
    return <>{children}</>;
  }

  // Otherwise show the Turnstile challenge
  return <TurnstileChallenge siteKey={siteKey} onSuccess={handleSuccess} />;
}
