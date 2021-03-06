import { ApolloError, ForbiddenError } from 'apollo-server-express';
import { UserChannelEventType } from 'src/modules/user/dto/user.payload';
import { User } from 'src/modules/user/user.model';
import EmailHelper from 'src/utils/email.helper';
import { MeetingServiceCtx } from '../meeting.service';
import { InviteMeetingInput } from '../dto/meeting.input';
import { Meeting } from '../meeting.model';

const inviteMeetingByEmail = (
  targetEmail: string,
  nickname: string,
  meetingId: string,
  passCode?: string,
) => {
  EmailHelper.sendMeetingInvitationEmail(
    nickname,
    targetEmail,
    meetingId,
    passCode,
  );
};

export const inviteUserToMeeting = ({
  meetingModel,
  userService,
  userModel,
}: MeetingServiceCtx) => async (
  { userId, meetingId, email }: InviteMeetingInput,
  currentUser: User,
): Promise<Meeting> => {
  const targetMeeting = await meetingModel.findOne({
    meetingId,
    endedAt: null,
  });
  if (!targetMeeting || targetMeeting.endedAt) {
    throw new ApolloError('Meeting not found');
  }
  const isPermitToWriteUser = await userService.isPermitToWriteUser(
    currentUser,
    targetMeeting.initiator,
  );

  if (!isPermitToWriteUser) {
    throw new ForbiddenError('Access denied');
  }

  let targetUser;
  if (userId) {
    targetUser = await userModel.findById(userId);
    // if (targetUser.status === UserCurrentStates.OFFLINE) {
    //   throw new ApolloError('User offline');
    // }
  }

  email &&
    inviteMeetingByEmail(
      email,
      currentUser.nickname,
      meetingId,
      targetMeeting.passCode,
    );

  if (userId) {
    await userService.createUserEventsAndDispatch({
      to: targetUser,
      eventType: UserChannelEventType.MEETING_INVITATION,
      meetingInvitation: { meetingId, inviter: currentUser },
    });
  }

  return targetMeeting;
};
