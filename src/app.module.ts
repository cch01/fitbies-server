import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { GraphQLModule } from '@nestjs/graphql';
import { join } from 'path';
import { UserModule } from './user/user.module';
import { CommonModule } from './common/common.module';
import { async } from 'rxjs';

console.log(process.env.DB_CONNECTION_URI);
@Module({
  imports: [
    MongooseModule.forRoot(process.env.DB_CONNECTION_URI, { useNewUrlParser: true }),
    GraphQLModule.forRoot({
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      context: async ({ req }) => {
        const auth = req.headers.Authorization || req.headers.authorization;
        
        return {
          ...req,
          auth
        }
      }
    }),
    UserModule,
    CommonModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
