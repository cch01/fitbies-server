require('dotenv').config();
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import initPeerServer from './peer.server';

const PORT = process.env.APP_PORT;
const peerPort = parseInt(process.env.PEER_PORT);

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser({}));
  app.enableCors({
    origin: 'http://localhost:4000',
    credentials: true,
  });
  initPeerServer(peerPort);
  console.log(`Peer server listing on ${peerPort}/meetings`);
  app.listen(PORT);
}
bootstrap();
