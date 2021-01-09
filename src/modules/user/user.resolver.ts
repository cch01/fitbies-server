import { ExecutionContext, UseGuards } from '@nestjs/common';
import {
  Args,
  Mutation,
  Resolver,
  Query,
  ID,
  ResolveField,
  Parent,
  Root,
  Context,
} from '@nestjs/graphql';
import { CurrentUser } from 'src/decorators/user.decorator';
import { RegisteredUserGuard } from 'src/guards/registered.user.guard';
import { SignInInput, SignUpInput, UpdateUserInput } from './dto/user.input';
import { SignInPayload } from './dto/user.payload';
import { User, UserConnection, UserDocument } from './user.model';
import { UserService } from './user.service';
import {
  ApolloError,
  ForbiddenError,
  UserInputError,
} from 'apollo-server-express';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { ConnectionArgs } from '../common/dto/connection.args';
import { sendEmail } from 'src/utils/send.email';
import { applyConnectionArgs } from 'src/utils/apply.connection.args';
import { SessionHandler } from 'src/guards/session.handler';
import { SessionService } from '../session/session.service';

//TODO forgot pw
@Resolver((of) => User)
@UseGuards(SessionHandler)
export class UserResolver {
  constructor(
    private readonly userService: UserService,
    private readonly sessionService: SessionService,
    @InjectModel('user') private readonly userModel: Model<UserDocument>,
  ) {}

  @Query((returns) => User, { nullable: true })
  @UseGuards(RegisteredUserGuard)
  async user(
    @Args('_id', { type: () => ID, nullable: true }) _id: string,
    @Args('email', { type: () => String, nullable: true }) email: string,
    @CurrentUser() currentUser: User,
  ): Promise<User> {
    return await this.userService.findUser(currentUser, { _id, email });
  }

  @Query((returns) => UserConnection, { nullable: true })
  @UseGuards(RegisteredUserGuard)
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
  @UseGuards(RegisteredUserGuard)
  async me(@CurrentUser() currentUser: User): Promise<User> {
    sendEmail();
    return currentUser;
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

    this.sessionService.setAccessTokenToCookie(
      'access-token',
      signInResult.token,
      ctx,
    );
    return signInResult;
  }

  @Mutation((returns) => User, { nullable: true })
  @UseGuards(RegisteredUserGuard)
  async updateUser(@Args('updateUserInput') updateUserInput: UpdateUserInput) {
    return await this.userService.updateUser(updateUserInput);
  }

  //TODO need to split to another file
  @ResolveField((returns) => String)
  async type(@Parent() user: User, @CurrentUser() currentUser: User) {
    const isPermitToReadUser = await this.userService.isPermitToReadUser(
      currentUser,
      user._id,
    );
    if (!isPermitToReadUser) {
      throw new ForbiddenError('Access denied');
    }
    return user.type;
  }
}
