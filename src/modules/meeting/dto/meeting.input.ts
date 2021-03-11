import { Field, ID, InputType } from '@nestjs/graphql';
import { IsEmail } from 'class-validator';
@InputType()
export class HostMeetingInput {
  @Field((type) => ID)
  initiatorId: string;

  @Field({ nullable: true })
  passCode?: string;

  @Field()
  meetingMuted: boolean;

  @Field()
  meetingVideoOff: boolean;
}

@InputType()
export class JoinMeetingInput {
  @Field()
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

  @Field()
  meetingId: string;
}

@InputType()
export class SendMeetingMessageInput {
  @Field((type) => ID)
  userId: string;

  @Field()
  content: string;

  @Field()
  meetingId: string;
}

@InputType()
export class BlockUserInput {
  @Field()
  meetingId: string;

  @Field((type) => ID)
  targetUserId: string;

  @Field((type) => ID)
  initiatorId: string;
}

@InputType()
export class ToggleMeetingMediaInput {
  @Field()
  meetingId: string;

  @Field()
  videoOff: boolean;

  @Field()
  muted: boolean;
}

@InputType()
export class ToggleParticipantMediaInput {
  @Field()
  participantId: string;

  @Field()
  meetingId: string;

  @Field()
  muted: boolean;

  @Field()
  videoOff: boolean;
}
