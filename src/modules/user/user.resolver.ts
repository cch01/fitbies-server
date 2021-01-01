import { UseGuards } from "@nestjs/common";
import { Args, Mutation, Resolver, Query, ID, ResolveField, Parent, Root } from "@nestjs/graphql";
import { CurrentUser } from "src/decorators/user.decorator";
import { AuthGuard } from "src/decorators/auth.guard";
import {  SignInInput, SignUpInput, UpdateUserInput } from "./dto/user.input";
import { SignInPayload } from "./dto/user.payload";
import { User } from "./user.model";
import { UserService } from "./user.service";




@Resolver(of => User)
export class UserResolver {

  constructor(private readonly userService: UserService) { }

  @Query(returns => User, { nullable: true })
  @UseGuards(AuthGuard)
  async user(
    @Args('_id', { type: () => ID, nullable: true }) _id: string,
    @Args('email', { type: () => String, nullable: true }) email: string
  ): Promise<User> {
    return await this.userService.findOne({ _id, email });
  }

  @Mutation(returns => User, { nullable: true })
  async signUp(
    @Args('signUpInput') signUpInput: SignUpInput
  ) {
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