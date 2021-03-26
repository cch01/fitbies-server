import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import { User, UserCurrentStates } from '../user.model';

export enum UserChannelEventType {
  MEETING_INVITATION = 'MEETING_INVITATION',
  PERSONAL_MESSAGE = 'PERSONAL_MESSAGE',
  FRIEND_STATUS = 'FRIEND_STATUS',
}

registerEnumType(UserChannelEventType, {
  name: 'UserChannelEventType',
});

@ObjectType()
export class PersonalMessage {
  @Field((type) => User)
  from: User;

  @Field((type) => ID)
  to: string;

  @Field()
  content: string;

  @Field((type) => Date)
  sentAt: Date;
}

@ObjectType()
export class UserState {
  @Field((type) => User)
  user: User;

  @Field((type) => UserCurrentStates)
  state: UserCurrentStates;
}

@ObjectType()
export class MeetingInvitation {
  @Field()
  meetingId: string;

  @Field((type) => User)
  inviter: User;
}

@ObjectType()
export class SignInPayload {
  @Field()
  token: string;

  @Field()
  user: User;
}

@ObjectType()
export class UserChannelPayload {
  @Field((type) => User)
  to: User;

  @Field((type) => UserChannelEventType)
  eventType: UserChannelEventType;

  @Field((type) => PersonalMessage, { nullable: true })
  personalMessage?: PersonalMessage;

  @Field((type) => UserState, { nullable: true })
  friendState?: UserState;

  @Field((type) => MeetingInvitation, { nullable: true })
  meetingInvitation?: MeetingInvitation;
}

@ObjectType()
export class HealthTracking {
  @Field()
  heartRate: number;

  @Field()
  distance: number;

  @Field()
  steps: number;

  @Field()
  calories: number;
}
