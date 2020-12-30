import { Args, Mutation, Resolver, Query, ID } from "@nestjs/graphql";
import { CreateUserInput } from "./dto/user.input";
import { User } from "./models/user.model";
import { UserService } from "./user.service";




@Resolver(of => User)
export class UserResolver {

  constructor(private readonly userService: UserService) { }


  @Query(returns => User, { nullable: true })
  async user(
    @Args('_id', { type: () => ID, nullable: true }) _id: string,
    @Args('email', { type: () => String, nullable: true }) email: string
  ): Promise<User> {
    return await this.userService.find({ _id, email });
  }

  @Mutation(returns => User, { nullable: true })
  async signUp(
    @Args('CreateUserInput') createUserInput: CreateUserInput
  ) {
    return await this.userService.createUser(createUserInput);
  }
}