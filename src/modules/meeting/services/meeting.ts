import { ForbiddenError } from 'apollo-server-express';
import { User } from 'src/modules/user/user.model';
import { MeetingServiceCtx } from '../meeting.service';
import { Meeting } from '../meeting.model';

export const meeting = ({
  userService,
  meetingModel,
}: MeetingServiceCtx) => async (
  meetingId: string,
  currentUser: User,
): Promise<Meeting> => {
  const meeting = await meetingModel.findOne({ meetingId });
  if (meeting.endedAt) {
    const isParticipant = meeting.participants.some(
      (p) => p._id.toString() === currentUser._id.toString(),
    );
    if (!isParticipant && !userService.isAdmin(currentUser)) {
      throw new ForbiddenError('Access denied');
    }
  }
  return meeting;
};
