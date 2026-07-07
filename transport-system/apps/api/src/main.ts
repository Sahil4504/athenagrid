import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { RedisIoAdapter } from './tracking/redis-io.adapter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.setGlobalPrefix(config.get('API_PREFIX', 'api/v1'));
  // Auth is Bearer-token based (no cookies), so a wildcard origin is safe for a
  // test deployment. Set CORS_ORIGIN to your frontend URL to lock it down.
  app.enableCors({ origin: config.get('CORS_ORIGIN', '*') });
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }),
  );

  // Multi-node WebSocket fan-out via Redis — only when REDIS_URL is set. Single
  // instance (local dev, Render free tier) uses the built-in in-memory adapter.
  const redisUrl = config.get<string>('REDIS_URL');
  if (redisUrl) {
    try {
      const redisAdapter = new RedisIoAdapter(app);
      await redisAdapter.connect(redisUrl);
      app.useWebSocketAdapter(redisAdapter);
      Logger.log('WebSocket Redis adapter connected', 'Bootstrap');
    } catch {
      Logger.warn('REDIS_URL set but unreachable — using in-memory WS adapter', 'Bootstrap');
    }
  } else {
    Logger.log('No REDIS_URL — using in-memory WS adapter (single node)', 'Bootstrap');
  }

  // Bind 0.0.0.0 so cloud platforms (Render) can route to the container.
  const port = config.get<number>('PORT', 4000);
  await app.listen(port, '0.0.0.0');
  Logger.log(`AthenaGrid Transport API on :${port}`, 'Bootstrap');
}
bootstrap();
