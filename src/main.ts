require('dotenv').config();
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';

const PORT = process.env.APP_PORT;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser({}));
  app.enableCors({
    origin: 'http://localhost:4000',
    credentials: true,
  });
  app.listen(PORT);
}
bootstrap();
