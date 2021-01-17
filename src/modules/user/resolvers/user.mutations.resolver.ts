import { Inject, UseGuards } from '@nestjs/common';
import { Args, Mutation, Resolver, Query, ID, Context } from '@nestjs/graphql';
import { CurrentUser } from 'src/decorators/user.decorator';
import { ActivatedUserGuard } from 'src/guards/activated.user.guard';
import { SignInInput, SignUpInput, UpdateUserInput } from '../dto/user.input';
import { SignInPayload } from '../dto/user.payload';
import { User, UserConnection, UserDocument } from '../user.model';
import { UserService } from '../user.service';
import { ForbiddenError } from 'apollo-server-express';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { ConnectionArgs } from 'src/modules/common/dto/connection.args';
import { applyConnectionArgs } from 'src/utils/apply.connection.args';
import { SessionHandler } from 'src/guards/session.handler';
import { SessionService } from 'src/modules/session/session.service';
import { PubSubEngine } from 'graphql-subscriptions';

//TODO forgot pw
@Resolver()
@UseGuards(SessionHandler)
export class UserMutationsResolver {
  constructor(
    private readonly userService: UserService,
    private readonly sessionService: SessionService,
    @InjectModel('user') private readonly userModel: Model<UserDocument>,
    @Inject('pubSub') private readonly pubSub: PubSubEngine,
  ) {}

  @Query((returns) => User, { nullable: true })
  @UseGuards(ActivatedUserGuard)
  async user(
    @Args('_id', { type: () => ID, nullable: true }) _id: string,
    @Args('email', { nullable: true }) email: string,
    @CurrentUser() currentUser: User,
  ): Promise<User> {
    return await this.userService.findUser(currentUser, { _id, email });
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

  @Mutation((returns) => User, { nullable: true })
  async signUp(@Args('signUpInput') signUpInput: SignUpInput): Promise<User> {
    if (signUpInput.type === 'ADMIN') {
      throw new ForbiddenError('Invalid input');
    }
    return await this.userService.createUser(signUpInput);
  }

  @Mutation((returns) => SignInPayload, { nullable: true })
  async signIn(@Args('signInInput') signInInput: SignInInput, @Context() ctx) {
    const signInResult = await this.userService.signIn(signInInput);
    this.sessionService.setAccessTokenToResponseHeader(signInResult.token, ctx);
    return signInResult;
  }

  @Mutation((returns) => Boolean, { nullable: true })
  @UseGuards(ActivatedUserGuard)
  async signOut(@Context() ctx) {
    ctx.user && (await this.sessionService.signOut(ctx.token));
    return true;
  }

  @Mutation((returns) => User, { nullable: true })
  @UseGuards(ActivatedUserGuard)
  async updateUser(@Args('updateUserInput') updateUserInput: UpdateUserInput) {
    return await this.userService.updateUser(updateUserInput);
  }
}
