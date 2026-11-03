import { NestFactory } from '@nestjs/core';
import { configureApp } from './configure-app.js';

// Load backend/.env before the app module is imported, because the module
// reads DATA_SOURCE when it is evaluated.
try {
  process.loadEnvFile();
} catch {
  // No .env file: rely on real environment variables.
}

// `npm run start:demo` passes --demo: sample data in memory, no database.
if (process.argv.includes('--demo')) process.env.DATA_SOURCE = 'memory';

async function bootstrap() {
  const { AppModule } = await import('./app.module.js');
  const app = configureApp(await NestFactory.create(AppModule));
  app.enableShutdownHooks();
  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
  console.log(`API ready on http://localhost:${port}/api`);
}
await bootstrap();
