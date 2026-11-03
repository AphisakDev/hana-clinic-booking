import { INestApplication, ValidationPipe } from '@nestjs/common';

/** Shared by main.ts and the e2e tests so both run the same setup. */
export function configureApp(app: INestApplication) {
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  const origins = process.env.CORS_ORIGIN?.split(',').map((o) => o.trim());
  app.enableCors({ origin: origins?.length ? origins : true });
  return app;
}
