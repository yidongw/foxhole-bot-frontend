import { Env } from '@/libs/Env';
import { useAuthStore } from '@/store/authStore';
import { useEffect, useRef, useState } from 'react';

type WebSocketMessage = {
  type: 'turnstile_verify' | 'invisible_turnstile_verify';
  token: string;
};

type WebSocketResponse = {
  type: 'turnstile_verify' | 'invisible_turnstile_verify';
  message: string;
};

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [isVerified, setIsVerified] = useState(true);
  const ws = useRef<WebSocket | null>(null);
  const { clientId } = useAuthStore();

  useEffect(() => {
    const connect = () => {
      if (ws.current?.readyState === WebSocket.OPEN) {
        return;
      }

      // Create WebSocket connection
      ws.current = new WebSocket(`${Env.NEXT_PUBLIC_API_HOST.replace('http', 'ws')}/ws/${clientId}`);

      ws.current.onopen = () => {
        setIsConnected(true);
      };

      ws.current.onclose = () => {
        setIsConnected(false);
      };

      ws.current.onmessage = (event) => {
        try {
          const response = JSON.parse(event.data) as WebSocketResponse;
          if (response.type === 'turnstile_verify' || response.type === 'invisible_turnstile_verify') {
            setIsVerified(response.message === 'pass');
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };
    };

    connect();

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [clientId]);

  const sendMessage = (message: WebSocketMessage) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
      return true;
    }
    return false;
  };

  const verifyTurnstile = (type: 'turnstile_verify' | 'invisible_turnstile_verify', token: string) => {
    return sendMessage({
      type,
      token,
    });
  };

  return {
    isConnected,
    isVerified,
    verifyTurnstile,
    connect: () => {
      if (ws.current?.readyState !== WebSocket.OPEN) {
        ws.current = new WebSocket(`${Env.NEXT_PUBLIC_API_HOST.replace('http', 'ws')}/ws/${clientId}`);
      }
    },
  };
}
