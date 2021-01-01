import { UseGuards } from "@nestjs/common";
import { Args, Mutation, Resolver, Query, ID, ResolveField, Parent, Root } from "@nestjs/graphql";
import { CurrentUser } from "src/decorators/user.decorator";
import { AuthGuard } from "src/decorators/auth.guard";
import { SignInInput, SignUpInput, UpdateUserInput } from "./dto/user.input";
import { SignInPayload } from "./dto/user.payload";
import { User, UserDocument } from "./user.model";
import { UserService } from "./user.service";
import { ApolloError, ForbiddenError, UserInputError } from "apollo-server-express";
import { Model } from "mongoose";
import { InjectModel } from "@nestjs/mongoose";




@Resolver(of => User)
export class UserResolver {

  constructor(
    private readonly userService: UserService,
    @InjectModel('user') private readonly userModel: Model<UserDocument>
  ) { }

  @Query(returns => User, { nullable: true })
  @UseGuards(AuthGuard)
  async user(
    @Args('_id', { type: () => ID, nullable: true }) _id: string,
    @Args('email', { type: () => String, nullable: true }) email: string,
    @CurrentUser() currentUser: User,
  ): Promise<User> {

    return await this.userService.findUser(currentUser, { _id, email });
  }

  @Query(returns => User)
  @UseGuards(AuthGuard)
  async me(
    @CurrentUser() currentUser: User,
  ): Promise<User> {
    return currentUser;
  }

  @Mutation(returns => User, { nullable: true })
  async signUp(
    @Args('signUpInput') signUpInput: SignUpInput
  ) {
    if(signUpInput.type === "ADMIN") {
      throw new ForbiddenError('Invalid input')
    }
    return await this.userService.createUser(signUpInput);
  }

  @Mutation(returns => SignInPayload, { nullable: true })
  async signIn(
    @Args('signInInput') signInInput: SignInInput
  ) {
    return await this.userService.signIn(signInInput);
  }

  @Mutation(returns => User, { nullable: true })
  @UseGuards(AuthGuard)
  async updateUser(
    @Args('updateUserInput') updateUserInput: UpdateUserInput
  ) {
    return await this.userService.updateUser(updateUserInput);
  }
}