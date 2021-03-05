import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GraphQLModule } from '@nestjs/graphql';
import { join } from 'path';
import { UserModule } from './modules/user/user.module';
import { CommonModule } from './modules/common/common.module';
import { SessionModule } from './modules/session/session.module';
import { MeetingModule } from './modules/meeting/meeting.module';
import { PubSubModule } from './pub.sub/pub.sub.module';
import * as _ from 'lodash';

@Module({
  imports: [
    MongooseModule.forRoot(process.env.DB_CONNECTION_URI, {
      useNewUrlParser: true,
    }),
    GraphQLModule.forRoot({
      path: process.env.GRAPHQL_PATH,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      installSubscriptionHandlers: true,
      subscriptions: {
        path: process.env.GRAPHQL_PATH,
        onConnect: (param, ws, connectionContext) => {
          console.log('someone connected via websocket');
          const authHeader =
            _.get(param, 'Authorization') || _.get(param, 'authorization');
          console.log('auth in ws', authHeader);
          return {
            webSocketAuth: authHeader,
          };
        },
      },
      context: async (context) => context,
      cors: {
        credentials: true,
        origin: true,
      },
    }),
    UserModule,
    CommonModule,
    SessionModule,
    MeetingModule,
    PubSubModule,
  ],
})
export class AppModule {}
