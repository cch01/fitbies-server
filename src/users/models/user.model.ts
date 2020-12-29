import { Field, GraphQLISODateTime, ID, ObjectType } from "@nestjs/graphql";


@ObjectType()
export class User {
  @Field(type => ID)
  _id: String;

  @Field()
  firstName: String;

  @Field()
  lastName: String;

  @Field()
  email: String;

  @Field()
  password: String;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}