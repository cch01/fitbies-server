import { ApolloError } from 'apollo-server-express';
import { User } from 'src/modules/user/user.model';
import { MeetingServiceCtx } from '../meeting.service';
import { MeetingEventType } from '../dto/meeting.payload';
import { Meeting } from '../meeting.model';
import { createMeetingEventsAndDispatch } from './createMeetingEventsAndDispatch';

export const endMeeting = (ctx: MeetingServiceCtx) => async (
  meetingId: string,
  userId: string,
  currentUser: User,
): Promise<Meeting> => {
  const { meetingModel } = ctx;
  const meeting = await meetingModel.findOne({
    meetingId,
    initiator: userId,
    endedAt: null,
  });

  if (!meeting) {
    throw new ApolloError('meeting not found');
  }

  if (meeting.endedAt) {
    throw new ApolloError('meeting has been ended already');
  }

  const updatedParticipants = meeting.toObject().participants.map((_p) => ({
    ..._p,
    isLeft: true,
    leftAt: _p.leftAt || new Date(),
  }));

  meeting
    .set({ endedAt: new Date(), participants: updatedParticipants })
    .save();

  await createMeetingEventsAndDispatch(ctx)({
    type: MeetingEventType.END_MEETING,
    from: currentUser,
    toMeeting: meeting,
  });

  return meeting;
};
