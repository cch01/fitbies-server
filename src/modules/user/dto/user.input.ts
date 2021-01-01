import { Field, InputType, registerEnumType } from "@nestjs/graphql";
import { UserType } from "../user.model";


@InputType()
export class SignUpInput {
  @Field()
  firstName: string;

  @Field()
  lastName: string;

  @Field()
  email: string;

  @Field()
  password: string;

  @Field(type => UserType)
  type: UserType;
} 

@InputType()
export class UpdateUserInput {
  @Field({ nullable: true})
  _id: string;

  @Field({ nullable: true})
  firstName: string;

  @Field({ nullable: true})
  lastName: string;

  @Field({ nullable: true})
  email: string;

} 



@InputType()
export class SignInInput {
  @Field()
  email: string;

  @Field()
  password: string;
}