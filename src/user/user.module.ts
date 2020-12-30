import { Module } from '@nestjs/common';
import { UserModel } from './models/user.model';
import { UserResolver } from './user.resolver';
import { UserService } from './user.service';

@Module({
  imports: [
    UserModel,
  ],
  providers: [UserService, UserResolver ],
  exports: [UserModel]
})
export class UserModule { }
