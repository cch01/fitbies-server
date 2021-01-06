import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { GraphQLModule } from '@nestjs/graphql';
import { join } from 'path';
import { UserModule } from './modules/user/user.module';
import { CommonModule } from './modules/common/common.module';
import { SessionModule } from './modules/session/session.module';
import { MeetingService } from './modules/meeting/meeting.service';
import { MeetingModule } from './modules/meeting/meeting.module';

@Module({
  imports: [
    MongooseModule.forRoot(process.env.DB_CONNECTION_URI, {
      useNewUrlParser: true,
    }),
    GraphQLModule.forRoot({
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      context: async ({ req }) => {
        req;
      },
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
