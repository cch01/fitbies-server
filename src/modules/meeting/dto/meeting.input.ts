import { Field, ID, InputType } from '@nestjs/graphql';
import { IsEmail } from 'class-validator';
@InputType()
export class HostMeetingInput {
  @Field((type) => ID)
  initiatorId: string;

  @Field({ nullable: true })
  passCode?: string;
}

@InputType()
export class JoinMeetingInput {
  @Field((type) => ID)
  meetingId: string;

  @Field((type) => ID)
  joinerId: string;

  @Field({ nullable: true })
  passCode?: string;
}

@InputType()
export class InviteMeetingInput {
  @Field((type) => ID, { nullable: true })
  userId?: string;

  @IsEmail()
  @Field({ nullable: true })
  email?: string;

  @Field((type) => ID)
  meetingId: string;
}

@InputType()
export class SendMeetingMessageInput {
  @Field((type) => ID)
  userId: string;

  @Field()
  content: string;

  @Field((type) => ID)
  meetingId: string;
}

@InputType()
export class BlockUserInput {
  @Field((type) => ID)
  meetingId: string;

  @Field((type) => ID)
  targetUserId: string;

  @Field((type) => ID)
  initiatorId: string;
}
