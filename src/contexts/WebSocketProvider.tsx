'use client';

import type { UserUpdateMessage } from '@/types/twitter';
import type { ReactNode } from 'react';
import type { WebSocketContextType } from './WebSocketContext';
import { Env } from '@/libs/Env';
import { useAuthStore } from '@/store/authStore';
import { useMonitorColumnsStore } from '@/store/monitorColumnsStore';
import { useProfileUpdatesStore } from '@/store/profileUpdatesStore';
import { useStatusUpdateStore } from '@/store/statusUpdateStore';
import { useTwitterUsersStore } from '@/store/twitterUsersStore';
import { usePathname } from 'next/navigation';
import { useCallback, useMemo, useRef, useState } from 'react';
import useWebSocketLib from 'react-use-websocket';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { WebSocketContext } from './WebSocketContext';

type WebSocketMessage = {
  type: 'turnstile_verify' | 'invisible_turnstile_verify' | 'subscribe' | 'unsubscribe';
  token?: string;
  twitterUsername?: string;
};

type WebSocketResponse = {
  type: 'turnstile_verify' | 'invisible_turnstile_verify' | 'user-update' | 'error' | 'disconnect' | 'connected';
  message?: string;
  data?: UserUpdateMessage['data'];
  subscriptions?: number;
};

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isRootPage = pathname === '/';

  const [isVerified, setIsVerified] = useState(true);
  const [connect, setConnect] = useState(isRootPage);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [shouldReconnect, setShouldReconnect] = useState(isRootPage);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const { clientId } = useAuthStore();
  const { setUser } = useTwitterUsersStore();
  const { addProfileUpdates } = useProfileUpdatesStore();
  const { addStatusUpdate } = useStatusUpdateStore();
  const { columns, addColumn } = useMonitorColumnsStore();
  const sendMessageRef = useRef<((message: string) => void) | null>(null);

  // Update connection state when pathname changes
  const shouldConnect = isRootPage && connect;

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
      } else if (response.type === 'connected') {
        // Check if there are no active subscriptions
        const totalUsernames = columns.reduce((total, column) => total + column.usernames.length, 0);
        const subscriptionCount = response.subscriptions || 0;

        // If no subscriptions on server and no columns locally, auto-subscribe to elonmusk
        if (subscriptionCount === 0 && totalUsernames === 0 && sendMessageRef.current) {
          // Subscribe to elonmusk
          sendMessageRef.current(JSON.stringify({
            type: 'subscribe',
            twitterUsername: 'elonmusk',
          }));

          // Add column for elonmusk
          addColumn({
            id: uuidv4(),
            name: 'elonmusk',
            usernames: ['elonmusk'],
          });
        }
      } else if (response.type === 'error') {
        const errorMessage = response.message || 'An error occurred';
        toast.error(errorMessage);
      } else if (response.type === 'disconnect') {
        const disconnectMessage = response.message || 'Disconnected from server';
        toast.error(disconnectMessage);
        setConnectionError(disconnectMessage);
        setShouldReconnect(false);
      }
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  }, [setUser, addProfileUpdates, addStatusUpdate, columns, addColumn]);

  const { sendMessage, readyState } = useWebSocketLib(
    `${Env.NEXT_PUBLIC_WS_HOST}/ws/${clientId}`,
    {
      shouldReconnect: () => {
        if (!shouldReconnect) {
          setConnect(false);
        } else {
          setIsReconnecting(true);
        }
        return shouldReconnect;
      },
      reconnectInterval: 3000,
      reconnectAttempts: 1200, // 1200 * 3000 = 3600000ms = 1 hour
      share: true,
      onMessage: handleMessage,
      onReconnectStop: () => {
        setConnect(false);
        setIsReconnecting(false);
        const errorMessage = 'Failed to connect. Please check your connection and try again.';
        setConnectionError(errorMessage);
        toast.error(errorMessage);
      },
      onError: (error) => {
        const errorMessage = `Connection error: ${error instanceof Error ? error.message : 'Connection failed'}`;
        setConnectionError(errorMessage);
        if (!isReconnecting) {
          toast.error(errorMessage);
        }
      },
      onOpen: () => {
        setConnectionError(null);
        setShouldReconnect(true);
        setIsReconnecting(false);
        toast.info('Successfully connected');
      },
    },
    shouldConnect,
  );

  // Store sendMessage in ref for use in handleMessage
  sendMessageRef.current = sendMessage;

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
    if (!isRootPage) {
      toast.error('WebSocket connection is only available on the monitor page');
      return;
    }
    setConnectionError(null);
    setConnect(true);
    setShouldReconnect(true);
    setIsReconnecting(false);
  }, [isRootPage]);

  const value: WebSocketContextType = useMemo(() => ({
    isConnected: readyState === WebSocket.OPEN,
    isVerified,
    connectionError,
    verifyTurnstile,
    subscribeToUser,
    unsubscribeToUser,
    connect: connectWebSocket,
  }), [readyState, isVerified, connectionError, verifyTurnstile, subscribeToUser, unsubscribeToUser, connectWebSocket]);

  return (
    <WebSocketContext value={value}>
      {children}
    </WebSocketContext>
  );
}
