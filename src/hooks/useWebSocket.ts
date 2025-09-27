"use client";

import { useEffect, useRef, useState, useCallback } from 'react';

interface WebSocketMessage {
  type: string;
  data: unknown;
}

interface UseWebSocketOptions {
  url?: string;
  onMessage?: (message: WebSocketMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  reconnectAttempts?: number;
  reconnectInterval?: number;
}

export function useWebSocket({
  url,
  onMessage,
  onConnect,
  onDisconnect,
  reconnectAttempts = 5,
  reconnectInterval = 3000
}: UseWebSocketOptions = {}) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [reconnectCount, setReconnectCount] = useState(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const shouldReconnectRef = useRef(true);

  const connect = useCallback(() => {
    // Dynamically construct WebSocket URL based on current location
    const getWebSocketUrl = () => {
      if (url) return url;
      
      if (typeof window === 'undefined') return 'ws://localhost:3002/ws';
      
      // In production, use the same host but port 3002
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const hostname = window.location.hostname;
      
      // For localhost development, use port 3002
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return `${protocol}//${hostname}:3002/ws`;
      }
      
      // For production, assume WebSocket server is on port 3002
      return `${protocol}//${hostname}:3002/ws`;
    };

    // Check if WebSocket is available in the browser
    if (typeof window === 'undefined' || !window.WebSocket) {
      setConnectionError('WebSocket is not supported in this environment');
      return;
    }

    try {
      setConnectionError(null);
      const wsUrl = getWebSocketUrl();
      console.log('Connecting to WebSocket:', wsUrl);
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        setIsConnected(true);
        setReconnectCount(0);
        setSocket(ws);
        setConnectionError(null);
        onConnect?.();
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          onMessage?.(message);
        } catch (error) {
          console.warn('Failed to parse WebSocket message:', error);
        }
      };

      ws.onclose = (event) => {
        setIsConnected(false);
        setSocket(null);
        onDisconnect?.();

        // Only show error if it's not a normal close
        if (event.code !== 1000 && event.code !== 1001) {
          setConnectionError(`Connection closed: ${event.reason || 'Unknown reason'}`);
        }

        if (shouldReconnectRef.current && reconnectCount < reconnectAttempts) {
          reconnectTimeoutRef.current = setTimeout(() => {
            setReconnectCount(prev => prev + 1);
            connect();
          }, reconnectInterval);
        }
      };

      ws.onerror = () => {
        // Don't log the error object as it's often empty
        // The real error info usually comes in the close event
        setConnectionError('Failed to connect to WebSocket server');
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setConnectionError(`Failed to create WebSocket connection: ${errorMessage}`);
      console.error('WebSocket connection error:', errorMessage);
    }
  }, [onMessage, onConnect, onDisconnect, reconnectCount, reconnectAttempts, reconnectInterval, url]);

  const disconnect = () => {
    shouldReconnectRef.current = false;
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (socket) {
      socket.close();
    }
  };

  const sendMessage = (message: WebSocketMessage) => {
    if (socket && isConnected) {
      socket.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected');
    }
  };

  useEffect(() => {
    connect();

    return () => {
      shouldReconnectRef.current = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socket) {
        socket.close();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    socket,
    isConnected,
    connectionError,
    sendMessage,
    connect,
    disconnect,
    reconnectCount
  };
}