import { Field, InputType } from "@nestjs/graphql";
import { InputTypeFactory } from "@nestjs/graphql/dist/schema-builder/factories/input-type.factory";
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