import { UseGuards } from '@nestjs/common';
import { Args, Resolver, Query, ID } from '@nestjs/graphql';
import { CurrentUser } from 'src/decorators/user.decorator';
import { ActivatedUserGuard } from 'src/guards/activated.user.guard';
import { User, UserConnection, UserDocument } from '../user.model';
import { UserService } from '../user.service';
import { ForbiddenError } from 'apollo-server-express';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { ConnectionArgs } from 'src/modules/common/dto/connection.args';
import { sendEmail } from 'src/utils/send.email';
import { applyConnectionArgs } from 'src/utils/apply.connection.args';
import { SessionHandler } from 'src/guards/session.handler';

@Resolver()
@UseGuards(SessionHandler)
export class UserQueriesResolver {
  constructor(
    private readonly userService: UserService,
    @InjectModel('user') private readonly userModel: Model<UserDocument>,
  ) {}

  @Query((returns) => User, { nullable: true })
  @UseGuards(ActivatedUserGuard)
  async user(
    @Args('_id', { type: () => ID, nullable: true }) _id: string,
    @Args('email', { nullable: true }) email: string,
    @CurrentUser() currentUser: User,
  ): Promise<User> {
    return await this.userService.user(currentUser, { _id, email });
  }

  @Query((returns) => UserConnection, { nullable: true })
  @UseGuards(ActivatedUserGuard)
  async users(
    @Args('connectionArgs', { type: () => ConnectionArgs, nullable: true })
    connectionArgs: ConnectionArgs,
    @CurrentUser() currentUser: User,
  ): Promise<UserConnection> {
    if (currentUser.type != 'ADMIN') {
      throw new ForbiddenError('Access denied');
    }
    return await applyConnectionArgs(connectionArgs, this.userModel);
  }

  @Query((returns) => User)
  @UseGuards(ActivatedUserGuard)
  async me(@CurrentUser() currentUser: User): Promise<User> {
    sendEmail();
    return currentUser;
  }
}
