import { Field, ObjectType } from "@nestjs/graphql";
import { User } from "../user.model";


@ObjectType()
export class SignInPayload {

  @Field()
  token: String;

  @Field()
  user: User;

}