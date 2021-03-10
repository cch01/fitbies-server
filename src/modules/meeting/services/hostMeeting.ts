import { MeetingServiceCtx } from '../meeting.service';
import { HostMeetingInput } from '../dto/meeting.input';
import { Meeting } from '../meeting.model';

export const hostMeeting = ({ meetingModel }: MeetingServiceCtx) => async ({
  initiatorId: initiator,
  isSelfMicOn,
  isSelfCamOn,
  isMeetingMicOn,
  isMeetingCamOn,
  passCode,
}: HostMeetingInput): Promise<Meeting> => {
  return new meetingModel({
    initiator,
    allowMic: isMeetingMicOn,
    allowCam: isMeetingCamOn,
    passCode,
    participants: [
      {
        _id: initiator,
        allowCam: isSelfCamOn,
        allowMic: isSelfMicOn,
      },
    ],
  }).save();
};
