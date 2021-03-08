import { User } from 'src/modules/user/user.model';
import { MeetingServiceCtx } from '../meeting.service';
import {
  MeetingChannelPayload,
  MeetingEventType,
  MeetingMessage,
  MeetingSettings,
  ParticipantSettings,
} from '../dto/meeting.payload';
import { Meeting } from '../meeting.model';

export interface CreateMeetingEventsAndDispatchInput {
  type: MeetingEventType;
  from: User;
  toMeeting: Meeting;
  message?: MeetingMessage;
  userToBeKickedOut?: User;
  meetingSettings?: MeetingSettings;
  participantSettings?: ParticipantSettings;
}

export const createMeetingEventsAndDispatch = ({
  pubSub,
}: MeetingServiceCtx) => async ({
  type,
  from,
  toMeeting,
  message,
  userToBeKickedOut,
  meetingSettings,
  participantSettings,
}: CreateMeetingEventsAndDispatchInput): Promise<MeetingChannelPayload> => {
  const meetingChannelPayload = {
    type,
    from,
    toMeeting,
    message,
    userToBeKickedOut,
    meetingSettings,
    participantSettings,
  };
  pubSub.publish('meetingChannel', {
    meetingChannel: meetingChannelPayload,
  });
  return meetingChannelPayload;
};
