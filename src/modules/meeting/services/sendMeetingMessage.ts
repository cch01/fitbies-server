import { ApolloError } from 'apollo-server-express';
import { User } from 'src/modules/user/user.model';
import { MeetingServiceCtx } from '../meeting.service';
import { SendMeetingMessageInput } from '../dto/meeting.input';
import { MeetingEventType, MeetingMessage } from '../dto/meeting.payload';
import { createMeetingEventsAndDispatch } from './createMeetingEventsAndDispatch';

export const sendMeetingMessage = (ctx: MeetingServiceCtx) => {
  return async (
    { content, meetingId }: SendMeetingMessageInput,
    currentUser: User,
  ): Promise<MeetingMessage> => {
    const meeting = await ctx.meetingModel.findOne({
      meetingId,
      participants: { $elemMatch: { _id: currentUser._id } },
      endedAt: null,
    });
    if (!meeting) {
      throw new ApolloError('Meeting not found');
    }

    const meetingMsg = {
      content,
      sentAt: new Date(),
    };
    await createMeetingEventsAndDispatch(ctx)({
      type: MeetingEventType.MESSAGE,
      from: currentUser,
      toMeeting: meeting,
      message: meetingMsg,
    });
    return meetingMsg;
  };
};
