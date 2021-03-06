import { ApolloError, ForbiddenError } from 'apollo-server-express';
import { User } from 'src/modules/user/user.model';
import { BlockUserInput } from '../dto/meeting.input';
import { MeetingEventType } from '../dto/meeting.payload';
import { Meeting } from '../meeting.model';
import { MeetingServiceCtx } from '../meeting.service';
import { createMeetingEventsAndDispatch } from './createMeetingEventsAndDispatch';

export const blockMeetingUser = (ctx: MeetingServiceCtx) => async (
  { initiatorId, meetingId, targetUserId }: BlockUserInput,
  currentUser: User,
): Promise<Meeting> => {
  const { userModel, userService, meetingModel } = ctx;

  const meeting = await meetingModel.findOne({
    initiator: initiatorId,
    meetingId,
    endedAt: null,
  });
  const targetUser = await userModel.findById(targetUserId);

  if (!targetUser) {
    throw new ApolloError('Target user not found');
  }

  const isPermitToWriteUser = await userService.isPermitToWriteUser(
    currentUser,
    meeting.initiator,
  );

  if (!isPermitToWriteUser) {
    throw new ForbiddenError('Access denied');
  }

  const isInBlockList = meeting.blockList.some(
    (_id) => _id.toString() === targetUserId.toString(),
  );

  if (isInBlockList) {
    throw new ApolloError('User already in block list');
  }
  const targetIndex = meeting.participants.findIndex(
    (p) => p._id.toString() === targetUserId.toString() && !p.isLeft,
  );

  if (targetIndex > -1) meeting.participants[targetIndex].isLeft = true;

  await createMeetingEventsAndDispatch(ctx)({
    type: MeetingEventType.BLOCK_USER,
    from: currentUser,
    toMeeting: meeting,
    userToBeKickedOut: targetUser,
  });

  meeting.blockList.push(targetUserId);
  return await meeting.save();
};
