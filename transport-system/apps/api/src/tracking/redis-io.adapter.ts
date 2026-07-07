import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { Redis } from 'ioredis';

/**
 * Socket.IO adapter backed by Redis pub/sub so a `bid:new` emitted on API replica A
 * reaches clients connected to replica B. This is what makes WebSockets horizontally
 * scalable across ECS/EKS tasks.
 */
export class RedisIoAdapter extends IoAdapter {
  private adapterConstructor!: ReturnType<typeof createAdapter>;

  async connect(url: string): Promise<void> {
    // lazyConnect so an unreachable Redis rejects here and main.ts can fall back.
    const pubClient = new Redis(url, { lazyConnect: true, maxRetriesPerRequest: 1 });
    const subClient = pubClient.duplicate();
    await Promise.all([pubClient.connect(), subClient.connect()]);
    this.adapterConstructor = createAdapter(pubClient, subClient);
  }

  createIOServer(port: number, options?: ServerOptions): any {
    const server = super.createIOServer(port, options);
    server.adapter(this.adapterConstructor);
    return server;
  }
}
