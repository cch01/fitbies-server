import { ApolloError } from 'apollo-server-express';
import { User } from 'src/modules/user/user.model';
import { MeetingServiceCtx } from '../meeting.service';
import { MeetingEventType } from '../dto/meeting.payload';
import { Meeting } from '../meeting.model';
import { createMeetingEventsAndDispatch } from './createMeetingEventsAndDispatch';

export const leaveMeeting = (ctx: MeetingServiceCtx) => async (
  meetingId: string,
  userId: string,
  currentUser: User,
): Promise<Meeting> => {
  const { meetingModel } = ctx;
  const meeting = await meetingModel.findOne({
    meetingId,
    participants: { $elemMatch: { _id: userId, isLeft: false } },
    endedAt: null,
  });
  if (!meeting) {
    throw new ApolloError(
      'Meeting not found / you are not joining this meeting',
    );
  }

  const updatedMeeting = await meetingModel.findOneAndUpdate(
    {
      meetingId,
      participants: { $elemMatch: { _id: userId } },
      endedAt: null,
    },
    {
      $set: {
        'participants.$.leftAt': new Date(),
        'participants.$.isLeft': true,
      },
    },
    { useFindAndModify: true, new: true },
  );

  const isUserLeft = meeting.participants.find((_p) => _p._id === userId)
    ?.isLeft;

  console.log('isUserLeft', isUserLeft);
  !isUserLeft &&
    (await createMeetingEventsAndDispatch(ctx)({
      type: MeetingEventType.LEAVE_MEETING,
      from: currentUser,
      toMeeting: updatedMeeting,
    }));

  setTimeout(async () => {
    const meeting = await meetingModel.findOne({
      meetingId,
      endedAt: null,
    });
    if (!meeting) return;
    console.log('End Meeting');
    const usersInMeeting = meeting?.participants.some((p) => !p.isLeft);
    if (!usersInMeeting) {
      await meeting.set('endedAt', new Date()).save();
    }
  }, 30000);

  return updatedMeeting;
};
