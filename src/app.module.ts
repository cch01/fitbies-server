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

@Module({
  imports: [
    MongooseModule.forRoot(process.env.DB_CONNECTION_URI, {
      useNewUrlParser: true,
    }),
    GraphQLModule.forRoot({
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      installSubscriptionHandlers: true,
      context: async ({ req, res }) => ({
        req,
        res,
      }),
    }),
    UserModule,
    CommonModule,
    SessionModule,
    MeetingModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
