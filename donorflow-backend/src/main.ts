import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import * as express from 'express';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api', {
    exclude: ['/', '/docs'],
  });

  // ✅ Keep this — it's the correct way to handle webhook raw body
  app.use('/api/payments/webhook', express.raw({ type: '*/*' }));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.use(cookieParser());

  // ✅ FIX: Use environment variable for CORS origins
  app.enableCors({
    origin: [
      process.env.FRONTEND_URL || 'http://localhost:5173',
      'http://localhost:5173', // Keep for local dev
      'http://localhost:3000', // Keep for local dev
    ],
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle('DonorFlow API')
    .setDescription('DonorFlow MVP API documentation')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        in: 'header',
      },
      'access-token',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const preferredPort = Number(process.env.PORT ?? 3000);

  try {
    await app.listen(preferredPort, '0.0.0.0');
    console.log(`🚀 Server running on port ${preferredPort}`);
    console.log(`📚 API Docs: http://localhost:${preferredPort}/docs`);
    console.log(`🌍 CORS origins: ${process.env.FRONTEND_URL || 'localhost'}`);
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === 'EADDRINUSE') {
      console.warn(`Port ${preferredPort} is busy. Falling back to an available port...`);
      await app.listen(0, '0.0.0.0');
      return;
    }
    throw error;
  }
}

void bootstrap();