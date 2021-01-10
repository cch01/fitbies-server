import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
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
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      installSubscriptionHandlers: true,
      subscriptions: {
        onConnect: (param, ws, connectionContext) => {
          const authHeader =
            _.get(param, 'Authorization') || _.get(param, 'authorization');
          return {
            webSocketAuth: authHeader,
          };
        },
      },
      context: async (context) => context,
    }),
    UserModule,
    CommonModule,
    SessionModule,
    MeetingModule,
    PubSubModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
