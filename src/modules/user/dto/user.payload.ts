import { Field, ObjectType } from '@nestjs/graphql';
import { User } from '../user.model';

@ObjectType()
export class SignInPayload {
  @Field()
  token: string;

  @Field()
  user: User;
}
