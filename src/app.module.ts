import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { GraphQLModule } from '@nestjs/graphql';

console.log(process.env.DB_CONNECTION_URI);
@Module({
  imports: [
    MongooseModule.forRoot(process.env.DB_CONNECTION_URI, { useNewUrlParser: true }),
    GraphQLModule.forRoot()
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
