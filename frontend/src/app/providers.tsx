'use client';

import React, { useState } from 'react';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { store } from '../store';

import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { getSocket, joinUserRoom } from '../services/socket';

function SocketListener() {
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      joinUserRoom(user.id);
      const socket = getSocket();

      socket.on('order_created', (data) => {
        console.log('[Realtime Alert] Order Created:', data);
      });

      socket.on('order_status_update', (data) => {
        console.log('[Realtime Alert] Order Status Update:', data);
      });

      return () => {
        socket.off('order_created');
        socket.off('order_status_update');
      };
    }
  }, [isAuthenticated, user]);

  return null;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <SocketListener />
        {children}
      </QueryClientProvider>
    </Provider>
  );
}
