import { Field, ObjectType, registerEnumType } from '@nestjs/graphql';
import { User } from 'src/modules/user/user.model';
import { Meeting } from '../meeting.model';

export enum MeetingEventType {
  USER_JOINED = 'USER_JOINED',
  MESSAGE = 'MESSAGE',
  BLOCK_USER = 'BLOCK_USER',
  END_MEETING = 'END_MEETING',
  LEAVE_MEETING = 'LEAVE_MEETING',
  TOGGLE_MEETING_SETTINGS = 'TOGGLE_MEETING_SETTINGS',
  TOGGLE_PARTICIPANT_SETTINGS = 'TOGGLE_PARTICIPANT_SETTINGS',
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
export class MeetingSettings {
  @Field()
  isMicOn: boolean;

  @Field()
  isCamOn: boolean;
}

@ObjectType()
export class ParticipantSettings {
  @Field()
  participantId: string;

  @Field()
  isMicOn: boolean;

  @Field()
  isCamOn: boolean;
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

  @Field((type) => MeetingSettings, { nullable: true })
  meetingSettings: MeetingSettings;

  @Field((type) => ParticipantSettings, { nullable: true })
  participantSettings: ParticipantSettings;
}
