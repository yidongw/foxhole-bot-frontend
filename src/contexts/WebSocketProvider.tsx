'use client';

import type { UserUpdateMessage } from '@/types/twitter';
import type { ReactNode } from 'react';
import type { WebSocketContextType } from './WebSocketContext';
import { Env } from '@/libs/Env';
import { useAuthStore } from '@/store/authStore';
import { useProfileUpdatesStore } from '@/store/profileUpdatesStore';
import { useStatusUpdateStore } from '@/store/statusUpdateStore';
import { useTwitterUsersStore } from '@/store/twitterUsersStore';
import { useCallback, useMemo, useState } from 'react';
import useWebSocketLib from 'react-use-websocket';
import { WebSocketContext } from './WebSocketContext';

type WebSocketMessage = {
  type: 'turnstile_verify' | 'invisible_turnstile_verify' | 'subscribe' | 'unsubscribe';
  token?: string;
  twitterUsername?: string;
};

type WebSocketResponse = {
  type: 'turnstile_verify' | 'invisible_turnstile_verify' | 'user-update';
  message?: string;
  data?: UserUpdateMessage['data'];
};

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const [isVerified, setIsVerified] = useState(true);
  const [connect, setConnect] = useState(false);
  const { clientId } = useAuthStore();
  const { setUser } = useTwitterUsersStore();
  const { addProfileUpdates } = useProfileUpdatesStore();
  const { addStatusUpdate } = useStatusUpdateStore();

  const handleMessage = useCallback((message: any) => {
    try {
      const response = JSON.parse(message.data) as WebSocketResponse;
      if (response.type === 'turnstile_verify' || response.type === 'invisible_turnstile_verify') {
        setIsVerified(response.message === 'pass');
      } else if (response.type === 'user-update' && response.data) {
        setUser(response.data.twitterUser);
        addProfileUpdates(response.data.twitterUser.id, response.data.changes);
        if (response.data.status) {
          addStatusUpdate(response.data.twitterUser.id, response.data.status);
        }
      }
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  }, [setUser, addProfileUpdates, addStatusUpdate]);

  const { sendMessage, readyState } = useWebSocketLib(
    `${Env.NEXT_PUBLIC_WS_HOST}/ws/${clientId}`,
    {
      shouldReconnect: () => {
        setConnect(false);
        return false;
      },
      reconnectInterval: 3000,
      share: true,
      onMessage: handleMessage,
      onReconnectStop: () => {
        setConnect(false);
      },
    },
    connect,
  );

  const sendWebSocketMessage = useCallback((message: WebSocketMessage): void => {
    sendMessage(JSON.stringify(message));
  }, [sendMessage]);

  const verifyTurnstile = useCallback((type: 'turnstile_verify' | 'invisible_turnstile_verify', token: string): void => {
    sendWebSocketMessage({
      type,
      token,
    });
  }, [sendWebSocketMessage]);

  const subscribeToUser = useCallback((twitterUsername: string): void => {
    sendWebSocketMessage({
      type: 'subscribe',
      twitterUsername,
    });
  }, [sendWebSocketMessage]);

  const unsubscribeToUser = useCallback((twitterUsername: string): void => {
    sendWebSocketMessage({
      type: 'unsubscribe',
      twitterUsername,
    });
  }, [sendWebSocketMessage]);

  const connectWebSocket = useCallback(() => {
    setConnect(true);
  }, []);

  const value: WebSocketContextType = useMemo(() => ({
    isConnected: readyState === WebSocket.OPEN,
    isVerified,
    verifyTurnstile,
    subscribeToUser,
    unsubscribeToUser,
    connect: connectWebSocket,
  }), [readyState, isVerified, verifyTurnstile, subscribeToUser, unsubscribeToUser, connectWebSocket]);

  return (
    <WebSocketContext value={value}>
      {children}
    </WebSocketContext>
  );
}
