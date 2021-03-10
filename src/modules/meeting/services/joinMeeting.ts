import { ApolloError, ForbiddenError } from 'apollo-server-express';
import { User } from 'src/modules/user/user.model';
import { MeetingServiceCtx } from '../meeting.service';
import { JoinMeetingInput } from '../dto/meeting.input';
import { MeetingEventType } from '../dto/meeting.payload';
import { Meeting } from '../meeting.model';
import { createMeetingEventsAndDispatch } from './createMeetingEventsAndDispatch';

export const joinMeeting = (ctx: MeetingServiceCtx) => async (
  { meetingId, joinerId, passCode, allowCam, allowMic }: JoinMeetingInput,
  currentUser: User,
): Promise<Meeting> => {
  const { meetingModel } = ctx;
  const meeting = await await meetingModel.findOne({
    meetingId,
    endedAt: null,
  });

  if (!meeting || meeting.endedAt) {
    throw new ApolloError('Meeting not found');
  }

  const isBlocked = meeting.blockList.some(
    (_id) => _id.toString() === joinerId.toString(),
  );

  if (isBlocked) {
    throw new ForbiddenError('You have been blocked in this meeting');
  }

  if (meeting.passCode && meeting.passCode !== passCode) {
    throw new ForbiddenError('Invalid pass code');
  }

  let updatedMeeting;
  const joinedRecord = meeting.participants.find(
    (_p) => _p._id.toString() === joinerId,
  );

  if (!joinedRecord) {
    const newRecord = { _id: joinerId, allowMic, allowCam };
    meeting.participants.push(newRecord);
    updatedMeeting = await meeting.save();
  } else {
    updatedMeeting = await meetingModel.findOneAndUpdate(
      {
        meetingId,
        endedAt: null,
        participants: { $elemMatch: { _id: joinerId } },
      },
      {
        $set: {
          'participants.$.joinedAt': new Date(),
          'participants.$.isLeft': false,
          'participants.$.allowCam': allowCam,
          'participants.$.allowMic': allowMic,
        },
      },
      { useFindAndModify: true, new: true },
    );
  }

  await createMeetingEventsAndDispatch(ctx)({
    type: MeetingEventType.USER_JOINED,
    from: currentUser,
    toMeeting: updatedMeeting,
  });

  return updatedMeeting;
};
