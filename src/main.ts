require('dotenv').config();
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import initPeerServer from './peer.server';

const PORT = process.env.APP_PORT;
const peerPort = parseInt(process.env.PEER_PORT);

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  initPeerServer(peerPort);
  app.listen(PORT);
}
bootstrap();
