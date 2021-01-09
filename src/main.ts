require('dotenv').config();
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import createPeerServer from './peer.server';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  const peerServer = createPeerServer(app.getHttpServer(), {
    path: '/',
    key: process.env.PEER_SERVER_KEY,
  });
  app.use('/meeting', peerServer);
  app.listen(3000);
}
bootstrap();
