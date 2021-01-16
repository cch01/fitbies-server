import { Field, ObjectType, registerEnumType } from '@nestjs/graphql';
import { User } from 'src/modules/user/user.model';
import { Meeting } from '../meeting.model';

export enum MeetingEventType {
  USER_JOINED = 'USER_JOINED',
  MESSAGE = 'MESSAGE',
  KICK_USER = 'KICK_USER',
  END_MEETING = 'END_MEETING',
  LEAVE_MEETING = 'LEAVE_MEETING',
}

registerEnumType(MeetingEventType, {
  name: 'MeetingEventType',
});

@ObjectType()
export class MeetingMessage {
  @Field({ nullable: true })
  content: string;

  @Field((type) => Date, { nullable: true })
  sentAt: Date;
}

@ObjectType()
export class MeetingEventsPayload {
  @Field((type) => MeetingEventType)
  type: MeetingEventType;

  @Field((type) => User)
  from: User;

  @Field((type) => Meeting, { nullable: true })
  toMeeting: Meeting;

  @Field((type) => MeetingMessage, { nullable: true })
  message?: MeetingMessage;

  @Field((type) => User, { nullable: true })
  userToBeKickedOut?: User;
}
