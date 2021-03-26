import { Field, InputType } from '@nestjs/graphql';
import { IsEmail } from 'class-validator';

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

  @Field()
  nickname: string;
}

@InputType()
export class UpdateUserInput {
  @Field({ nullable: true })
  _id: string;

  @Field({ nullable: true })
  firstName: string;

  @Field({ nullable: true })
  lastName: string;

  @Field({ nullable: true })
  email: string;
}

@InputType()
export class SignInInput {
  @Field()
  email: string;

  @Field()
  password: string;
}

@InputType()
export class ResetPasswordInput {
  @IsEmail()
  @Field()
  email: string;

  @Field()
  oldPassword: string;

  @Field()
  newPassword: string;

  @Field()
  confirmPassword: string;
}

@InputType()
export class AnonymousSignUpInput {
  @Field()
  nickname: string;
}

@InputType()
export class HealthTrackingInput {
  @Field()
  heartRate: number;

  @Field()
  distance: number;

  @Field()
  steps: number;

  @Field()
  calories: number;
}
