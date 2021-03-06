import { MeetingServiceCtx } from '../meeting.service';
import { HostMeetingInput } from '../dto/meeting.input';
import { Meeting } from '../meeting.model';

export const hostMeeting = ({ meetingModel }: MeetingServiceCtx) => async ({
  initiatorId: initiator,
  isMicOn,
  isCamOn,
  passCode,
}: HostMeetingInput): Promise<Meeting> => {
  return new meetingModel({
    initiator,
    isMicOn,
    isCamOn,
    passCode,
    participants: [{ _id: initiator }],
  }).save();
};
