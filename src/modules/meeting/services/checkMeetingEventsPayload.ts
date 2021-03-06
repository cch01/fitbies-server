import { MeetingServiceCtx } from '../meeting.service';
import { MeetingEventsPayload } from '../dto/meeting.payload';

export const checkMeetingEventsPayload = ({
  meetingModel,
}: MeetingServiceCtx) => async (
  { type }: MeetingEventsPayload,
  { meetingId }: { meetingId: string },
  ctx: any,
): Promise<boolean> => {
  //TODO meeting loader
  const meeting = await meetingModel.findOne({
    meetingId,
    participants: { $elemMatch: { _id: ctx.user._id } },
  });
  if (!meeting) return false;
  console.log('subscribing user', ctx.user._id);
  return true;
};
