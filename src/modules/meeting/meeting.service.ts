import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  ApolloError,
  ForbiddenError,
  PubSubEngine,
} from 'apollo-server-express';
import { Model } from 'mongoose';
import { User, UserDocument } from '../user/user.model';
import { UserService } from '../user/user.service';
import {
  BlockUserInput,
  HostMeetingInput,
  InviteMeetingInput,
  JoinMeetingInput,
  SendMeetingMessageInput,
  ToggleMeetingMicAndCamInput,
  ToggleParticipantMicAndCamInput,
} from './dto/meeting.input';
import {
  MeetingEventsPayload,
  MeetingEventType,
  MeetingMessage,
  MeetingSettings,
  ParticipantSettings,
} from './dto/meeting.payload';
import { Meeting, MeetingDocument } from './meeting.model';
import * as _ from 'lodash';
import EmailHelper from 'src/utils/email.helper';
import { UserChannelEventType } from '../user/dto/user.payload';
interface CreateMeetingEventsAndDispatchInput {
  type: MeetingEventType;
  from: User;
  toMeeting: Meeting;
  message?: MeetingMessage;
  userToBeKickedOut?: User;
  meetingSettings?: MeetingSettings;
  participantSettings?: ParticipantSettings;
}

@Injectable()
export class MeetingService {
  constructor(
    @InjectModel('meeting') private meetingModel: Model<MeetingDocument>,
    @InjectModel('user') private userModel: Model<UserDocument>,
    @Inject('pubSub') private readonly pubSub: PubSubEngine,
    private readonly userService: UserService,
  ) {}

  async hostMeeting({
    initiatorId: initiator,
    isMicOn,
    isCamOn,
    passCode,
  }: HostMeetingInput): Promise<Meeting> {
    return new this.meetingModel({
      initiator,
      isMicOn,
      isCamOn,
      passCode,
      participants: [{ _id: initiator }],
    }).save();
  }

  async joinMeeting(
    { meetingId, joinerId, passCode, isCamOn, isMicOn }: JoinMeetingInput,
    currentUser: User,
  ): Promise<Meeting> {
    const meeting = await await this.meetingModel.findOne({
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
      const newRecord = { _id: joinerId, isMicOn, isCamOn };
      meeting.participants.push(newRecord);
      updatedMeeting = await meeting.save();
    } else {
      updatedMeeting = await this.meetingModel.findOneAndUpdate(
        {
          meetingId,
          endedAt: null,
          participants: { $elemMatch: { _id: joinerId } },
        },
        {
          $set: {
            'participants.$.joinedAt': new Date(),
            'participants.$.isLeft': false,
            'participants.$.isCamOn': isCamOn,
            'participants.$.isMicOn': isMicOn,
          },
        },
        { useFindAndModify: true, new: true },
      );
    }

    await this.createMeetingEventsAndDispatch({
      type: MeetingEventType.USER_JOINED,
      from: currentUser,
      toMeeting: updatedMeeting,
    });

    return updatedMeeting;
  }

  async toggleMeetingMicAndCam(
    { meetingId, ...input }: ToggleMeetingMicAndCamInput,
    currentUser: User,
  ): Promise<Meeting> {
    const targetMeeting = await this.meetingModel.findOne({
      meetingId,
    });
    if (!targetMeeting) throw new ApolloError('Meeting not found');
    const isPermitToWriteUser = await this.userService.isPermitToWriteUser(
      currentUser,
      targetMeeting.initiator,
    );
    if (!isPermitToWriteUser) throw new ApolloError('Access denied');

    const updatedMeeting = await targetMeeting.set({ ...input }).save();

    await this.createMeetingEventsAndDispatch({
      type: MeetingEventType.TOGGLE_MEETING_SETTINGS,
      from: currentUser,
      toMeeting: updatedMeeting,
      meetingSettings: input,
    });

    return updatedMeeting;
  }

  async toggleParticipantMicAndCam(
    {
      meetingId,
      participantId,
      isCamOn,
      isMicOn,
    }: ToggleParticipantMicAndCamInput,
    currentUser: User,
  ): Promise<Meeting> {
    const targetMeeting = await this.meetingModel.findOne({
      meetingId,
      endedAt: null,
      participants: { $elemMatch: { _id: participantId, isLeft: false } },
    });
    if (!targetMeeting)
      throw new ApolloError('Meeting not found / participant left');
    const isPermitToWriteUser = await this.userService.isPermitToWriteUser(
      currentUser,
      targetMeeting.initiator,
    );
    if (!isPermitToWriteUser) throw new ApolloError('Access denied');
    const updatedMeeting = await this.meetingModel.findOneAndUpdate(
      {
        meetingId,
        endedAt: null,
        participants: { $elemMatch: { _id: participantId } },
      },
      {
        $set: {
          'participants.$.isCamOn': isCamOn,
          'participants.$.isMicOn': isMicOn,
        },
      },
      { useFindAndModify: true, new: true },
    );
    await this.createMeetingEventsAndDispatch({
      type: MeetingEventType.TOGGLE_PARTICIPANT_SETTINGS,
      from: currentUser,
      toMeeting: updatedMeeting,
      participantSettings: { participantId, isCamOn, isMicOn },
    });

    return updatedMeeting;
  }

  async endMeeting(
    meetingId: string,
    userId: string,
    currentUser: User,
  ): Promise<Meeting> {
    const meeting = await this.meetingModel.findOne({
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

    await this.createMeetingEventsAndDispatch({
      type: MeetingEventType.END_MEETING,
      from: currentUser,
      toMeeting: meeting,
    });

    return meeting;
  }

  async leaveMeeting(
    meetingId: string,
    userId: string,
    currentUser: User,
  ): Promise<Meeting> {
    const meeting = await this.meetingModel.findOne({
      meetingId,
      participants: { $elemMatch: { _id: userId, isLeft: false } },
      endedAt: null,
    });
    if (!meeting) {
      throw new ApolloError(
        'Meeting not found / you are not joining this meeting',
      );
    }

    const updatedMeeting = await this.meetingModel.findOneAndUpdate(
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
      (await this.createMeetingEventsAndDispatch({
        type: MeetingEventType.LEAVE_MEETING,
        from: currentUser,
        toMeeting: updatedMeeting,
      }));

    setTimeout(async () => {
      const meeting = await this.meetingModel.findOne({
        meetingId,
        endedAt: null,
      });
      if (!meeting) return;
      const usersInMeeting = meeting?.participants.some((p) => !p.isLeft);
      if (!usersInMeeting) {
        await meeting.set('endedAt', new Date()).save();
      }
    }, 30000);

    return updatedMeeting;
  }

  async blockMeetingUser(
    { initiatorId, meetingId, targetUserId }: BlockUserInput,
    currentUser: User,
  ): Promise<Meeting> {
    const meeting = await this.meetingModel.findOne({
      initiator: initiatorId,
      meetingId,
      endedAt: null,
    });

    const targetUser = await this.userModel.findById(targetUserId);

    if (!targetUser) {
      throw new ApolloError('Target user not found');
    }

    const isPermitToWriteUser = await this.userService.isPermitToWriteUser(
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

    await this.createMeetingEventsAndDispatch({
      type: MeetingEventType.BLOCK_USER,
      from: currentUser,
      toMeeting: meeting,
      userToBeKickedOut: targetUser,
    });

    meeting.blockList.push(targetUserId);
    return await meeting.save();
  }

  async unblockMeetingUser(
    { initiatorId, meetingId, targetUserId }: BlockUserInput,
    currentUser: User,
  ): Promise<Meeting> {
    const meeting = await this.meetingModel.findOne({
      initiator: initiatorId,
      meetingId,
      endedAt: null,
    });

    const targetUser = await this.userModel.findById(targetUserId);

    if (!targetUser) {
      throw new ApolloError('Target user not found');
    }

    const isPermitToWriteUser = await this.userService.isPermitToWriteUser(
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
  }

  async meeting(meetingId: string, currentUser: User): Promise<Meeting> {
    const meeting = await this.meetingModel.findOne({ meetingId });
    if (meeting.endedAt) {
      const isParticipant = meeting.participants.some(
        (p) => p._id.toString() === currentUser._id.toString(),
      );
      if (!isParticipant && !this.userService.isAdmin(currentUser)) {
        throw new ForbiddenError('Access denied');
      }
    }
    return meeting;
  }

  inviteMeetingByEmail(
    targetEmail: string,
    nickname: string,
    meetingId: string,
    passCode?: string,
  ) {
    EmailHelper.sendMeetingInvitationEmail(
      nickname,
      targetEmail,
      meetingId,
      passCode,
    );
  }

  async inviteUserToMeeting(
    { userId, meetingId, email }: InviteMeetingInput,
    currentUser: User,
  ): Promise<Meeting> {
    const targetMeeting = await this.meetingModel.findOne({
      meetingId,
      endedAt: null,
    });
    if (!targetMeeting || targetMeeting.endedAt) {
      throw new ApolloError('Meeting not found');
    }
    const isPermitToWriteUser = await this.userService.isPermitToWriteUser(
      currentUser,
      targetMeeting.initiator,
    );

    if (!isPermitToWriteUser) {
      throw new ForbiddenError('Access denied');
    }

    let targetUser;
    if (userId) {
      targetUser = await this.userModel.findById(userId);
      // if (targetUser.status === UserCurrentStates.OFFLINE) {
      //   throw new ApolloError('User offline');
      // }
    }

    email &&
      this.inviteMeetingByEmail(
        email,
        currentUser.nickname,
        meetingId,
        targetMeeting.passCode,
      );

    if (userId) {
      await this.userService.createUserEventsAndDispatch({
        to: targetUser,
        eventType: UserChannelEventType.MEETING_INVITATION,
        meetingInvitation: { meetingId, inviter: currentUser },
      });
    }

    return targetMeeting;
  }

  async createMeetingEventsAndDispatch({
    type,
    from,
    toMeeting,
    message,
    userToBeKickedOut,
    meetingSettings,
    participantSettings,
  }: CreateMeetingEventsAndDispatchInput): Promise<MeetingEventsPayload> {
    const meetingEventsPayload = {
      type,
      from,
      toMeeting,
      message,
      userToBeKickedOut,
      meetingSettings,
      participantSettings,
    };
    this.pubSub.publish('meetingChannel', {
      meetingChannel: meetingEventsPayload,
    });
    return meetingEventsPayload;
  }

  async checkMeetingEventsPayload(
    { type }: MeetingEventsPayload,
    { meetingId }: { meetingId: string },
    ctx: any,
  ): Promise<boolean> {
    //TODO meeting loader
    const meeting = await this.meetingModel.findOne({
      meetingId,
      participants: { $elemMatch: { _id: ctx.user._id } },
    });
    if (!meeting) return false;
    console.log('subscribing user', ctx.user._id);
    return true;
  }

  async sendMeetingMessage(
    { content, meetingId }: SendMeetingMessageInput,
    currentUser: User,
  ): Promise<MeetingMessage> {
    const meeting = await this.meetingModel.findOne({
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

    await this.createMeetingEventsAndDispatch({
      type: MeetingEventType.MESSAGE,
      from: currentUser,
      toMeeting: meeting,
      message: meetingMsg,
    });

    return meetingMsg;
  }
}
