import { ApolloError } from 'apollo-server-express';
import { User } from 'src/modules/user/user.model';
import { MeetingServiceCtx } from '../meeting.service';
import { ToggleMeetingMicAndCamInput } from '../dto/meeting.input';
import { MeetingEventType } from '../dto/meeting.payload';
import { Meeting } from '../meeting.model';
import { createMeetingEventsAndDispatch } from './createMeetingEventsAndDispatch';

export const toggleMeetingMicAndCam = (ctx: MeetingServiceCtx) => async (
  { meetingId, ...input }: ToggleMeetingMicAndCamInput,
  currentUser: User,
): Promise<Meeting> => {
  const { meetingModel, userService } = ctx;
  const targetMeeting = await meetingModel.findOne({
    meetingId,
    endedAt: null,
  });
  if (!targetMeeting) throw new ApolloError('Meeting not found');
  const isPermitToWriteUser = await userService.isPermitToWriteUser(
    currentUser,
    targetMeeting.initiator,
  );
  if (!isPermitToWriteUser) throw new ApolloError('Access denied');

  const updatedMeeting = await targetMeeting.set({ ...input }).save();

  await createMeetingEventsAndDispatch(ctx)({
    type: MeetingEventType.TOGGLE_MEETING_SETTINGS,
    from: currentUser,
    toMeeting: updatedMeeting,
    meetingSettings: input,
  });

  return updatedMeeting;
};
