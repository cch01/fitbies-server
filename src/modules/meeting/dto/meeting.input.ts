import { Field, ID, InputType } from '@nestjs/graphql';

@InputType()
export class CreateMeetingInput {
  @Field((type) => ID)
  initiatorId: string;

  @Field({ nullable: true })
  passCode?: string;

  @Field({ nullable: true })
  needApproval: boolean;
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
