import { Inject, UseGuards } from '@nestjs/common';
import { Args, Mutation, Resolver, Context, ID } from '@nestjs/graphql';
import { CurrentUser } from 'src/decorators/user.decorator';
import { ActivatedUserGuard } from 'src/guards/activated.user.guard';
import {
  AnonymousSignUpInput,
  ResetPasswordInput,
  SignInInput,
  SignUpInput,
  UpdateUserInput,
} from '../dto/user.input';
import { SignInPayload } from '../dto/user.payload';
import { User, UserDocument } from '../user.model';
import { UserService } from '../user.service';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { SessionHandler } from 'src/guards/session.handler';
import { SessionService } from 'src/modules/session/session.service';
import { PubSubEngine } from 'graphql-subscriptions';
import { GeneralUserGuard } from 'src/guards/general.user.guard';

//TODO: register as registered User, shut up ppl in meeting
@Resolver()
@UseGuards(SessionHandler)
export class UserMutationsResolver {
  constructor(
    private readonly userService: UserService,
    private readonly sessionService: SessionService,
    @InjectModel('user') private readonly userModel: Model<UserDocument>,
    @Inject('pubSub') private readonly pubSub: PubSubEngine,
  ) {}

  @Mutation((returns) => User, { nullable: true })
  async signUp(@Args('signUpInput') signUpInput: SignUpInput): Promise<User> {
    return await this.userService.createUser(signUpInput);
  }

  @Mutation((returns) => User, { nullable: true })
  async activateAccount(@Args('token') token: string): Promise<User> {
    return await this.userService.activateAccount(token);
  }

  @Mutation((returns) => User, { nullable: true })
  @UseGuards(GeneralUserGuard)
  async resendActivationEmail(
    @Args('userId', { type: () => ID }) userId: string,
    @CurrentUser() currentUser: User,
  ): Promise<User> {
    return await this.userService.sendActivationEmail(userId, currentUser);
  }

  @Mutation((returns) => User)
  async anonymousSignUp(
    @Args('anonymousSignUpInput') anonymousSignUpInput: AnonymousSignUpInput,
  ): Promise<User> {
    return await this.userService.createAnonymousUser(anonymousSignUpInput);
  }

  @Mutation((returns) => SignInPayload, { nullable: true })
  async signIn(
    @Args('signInInput') signInInput: SignInInput,
    @Context() ctx,
  ): Promise<SignInPayload> {
    const signInResult = await this.userService.signIn(signInInput);
    this.sessionService.setAccessTokenToResponseHeader(signInResult.token, ctx);
    return signInResult;
  }

  @Mutation((returns) => Boolean, { nullable: true })
  @UseGuards(ActivatedUserGuard)
  async signOut(@Context() ctx): Promise<boolean> {
    ctx.user && (await this.sessionService.signOut(ctx.token));
    return true;
  }

  @Mutation((returns) => User, { nullable: true })
  @UseGuards(ActivatedUserGuard)
  async updateUser(@Args('updateUserInput') updateUserInput: UpdateUserInput) {
    return await this.userService.updateUser(updateUserInput);
  }

  @Mutation((returns) => User, { nullable: true })
  @UseGuards(ActivatedUserGuard)
  async resetPassword(
    @Args('resetPasswordInput') resetPasswordInput: ResetPasswordInput,
    @CurrentUser() currentUser: User,
  ) {
    return await this.userService.resetPassword(
      currentUser,
      resetPasswordInput,
    );
  }
}
