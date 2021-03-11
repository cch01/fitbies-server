import { MeetingServiceCtx } from '../meeting.service';
import { HostMeetingInput } from '../dto/meeting.input';
import { Meeting } from '../meeting.model';

export const hostMeeting = ({ meetingModel }: MeetingServiceCtx) => async ({
  initiatorId: initiator,
  meetingMuted,
  meetingVideoOff,
  passCode,
}: HostMeetingInput): Promise<Meeting> => {
  return new meetingModel({
    initiator,
    muted: meetingMuted,
    videoOff: meetingVideoOff,
    passCode,
    participants: [
      {
        _id: initiator,
        joinedAt: new Date(),
      },
    ],
  }).save();
};
