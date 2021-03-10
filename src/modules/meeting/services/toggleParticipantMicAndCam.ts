import { ApolloError } from 'apollo-server-express';
import { User } from 'src/modules/user/user.model';
import { MeetingServiceCtx } from '../meeting.service';
import { ToggleParticipantMicAndCamInput } from '../dto/meeting.input';
import { MeetingEventType } from '../dto/meeting.payload';
import { Meeting } from '../meeting.model';
import { createMeetingEventsAndDispatch } from './createMeetingEventsAndDispatch';

export const toggleParticipantMicAndCam = (ctx: MeetingServiceCtx) => async (
  {
    meetingId,
    participantId,
    allowCam,
    allowMic,
  }: ToggleParticipantMicAndCamInput,
  currentUser: User,
): Promise<Meeting> => {
  const { meetingModel, userService } = ctx;
  const targetMeeting = await meetingModel.findOne({
    meetingId,
    endedAt: null,
    participants: { $elemMatch: { _id: participantId, isLeft: false } },
  });
  if (!targetMeeting)
    throw new ApolloError('Meeting not found / participant left');
  const isPermitToWriteUser = await userService.isPermitToWriteUser(
    currentUser,
    targetMeeting.initiator,
  );
  if (!isPermitToWriteUser) throw new ApolloError('Access denied');
  const updatedMeeting = await meetingModel.findOneAndUpdate(
    {
      meetingId,
      endedAt: null,
      participants: { $elemMatch: { _id: participantId } },
    },
    {
      $set: {
        'participants.$.allowCam': allowCam,
        'participants.$.allowMic': allowMic,
      },
    },
    { useFindAndModify: true, new: true },
  );
  await createMeetingEventsAndDispatch(ctx)({
    type: MeetingEventType.TOGGLE_PARTICIPANT_SETTINGS,
    from: currentUser,
    toMeeting: updatedMeeting,
    participantSettings: { participantId, allowCam, allowMic },
  });

  return updatedMeeting;
};
