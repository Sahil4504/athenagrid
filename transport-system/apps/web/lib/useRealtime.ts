'use client';
import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { REALTIME_NAMESPACE, RealtimeEvent } from '@athenagrid/shared';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? 'http://localhost:4000';

/**
 * Subscribe to a job's live bid feed or a trip's live location/status.
 * Returns the rolling list of realtime events for that room.
 */
export function useRealtime(
  kind: 'job' | 'trip',
  id: string | null,
  token: string | null,
) {
  const [events, setEvents] = useState<RealtimeEvent[]>([]);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!id || !token) return;
    const socket = io(`${WS_URL}${REALTIME_NAMESPACE}`, { auth: { token } });
    socketRef.current = socket;

    socket.emit(kind === 'job' ? 'join:job' : 'join:trip', id);

    const push = (e: RealtimeEvent) => setEvents((prev) => [e, ...prev].slice(0, 100));
    ['bid:new', 'bid:awarded', 'trip:location', 'trip:status'].forEach((evt) =>
      socket.on(evt, push),
    );

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [kind, id, token]);

  return { events, socket: socketRef };
}
