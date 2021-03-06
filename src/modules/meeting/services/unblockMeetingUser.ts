import { ApolloError, ForbiddenError } from 'apollo-server-express';
import { User } from 'src/modules/user/user.model';
import { MeetingServiceCtx } from '../meeting.service';
import { BlockUserInput } from '../dto/meeting.input';
import { Meeting } from '../meeting.model';

export const unblockMeetingUser = ({
  meetingModel,
  userModel,
  userService,
}: MeetingServiceCtx) => async (
  { initiatorId, meetingId, targetUserId }: BlockUserInput,
  currentUser: User,
): Promise<Meeting> => {
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

  const targetUserIndex = meeting.blockList.findIndex(
    (_id) => _id.toString() === targetUserId.toString(),
  );

  if (targetUserIndex < 0) {
    throw new ApolloError('User is not in block list');
  }

  meeting.blockList.splice(targetUserIndex, 1);
  console.log(meeting.blockList);

  return await meeting.save();
};
