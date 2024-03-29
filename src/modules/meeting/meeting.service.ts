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
} from './dto/meeting.input';
import {
  MeetingEventsPayload,
  MeetingEventType,
  MeetingMessage,
} from './dto/meeting.payload';
import { Meeting, MeetingDocument } from './meeting.model';
import * as _ from 'lodash';
import EmailHelper from 'src/utils/email.helper';
import { UserChannelEventType } from '../user/dto/user.payload';

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
    passCode,
  }: HostMeetingInput): Promise<Meeting> {
    const newMeeting = new this.meetingModel({
      initiator,
      passCode,
      participants: [{ _id: initiator }],
    });

    return newMeeting.save();
  }

  async joinMeeting(
    { meetingId, joinerId, passCode }: JoinMeetingInput,
    currentUser: User,
  ): Promise<Meeting> {
    const meeting = await await this.meetingModel.findOne({ _id: meetingId });

    if (!meeting || meeting.endedAt) {
      throw new ApolloError('Meeting not found.');
    }

    const isBlocked = meeting.blockList.some(
      (_id) => _id.toString() === joinerId.toString(),
    );

    if (isBlocked) {
      throw new ForbiddenError('You have been blocked in this meeting');
    }

    if (meeting.passCode && meeting.passCode !== passCode) {
      throw new ForbiddenError('Wrong pass code.');
    }

    let updatedMeeting;
    const joinedRecord = meeting.participants.find(
      (_p) => _p._id.toString() === joinerId,
    );

    if (!joinedRecord) {
      const newRecord = { _id: joinerId };
      meeting.participants.push(newRecord);
      updatedMeeting = await meeting.save();
    } else {
      updatedMeeting = await this.meetingModel.findOneAndUpdate(
        {
          _id: meetingId,
          participants: { $elemMatch: { _id: joinerId } },
        },
        {
          $set: {
            'participants.$.joinedAt': new Date(),
            'participants.$.isLeft': false,
          },
        },
        { useFindAndModify: true, new: true },
      );
    }

    await this.createMeetingEventsAndDispatch(
      MeetingEventType.USER_JOINED,
      currentUser,
      updatedMeeting,
    );

    return updatedMeeting;
  }

  async endMeeting(
    meetingId: string,
    userId: string,
    currentUser: User,
  ): Promise<Meeting> {
    const meeting = await this.meetingModel.findOne({
      _id: meetingId,
      initiator: userId,
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

    await this.createMeetingEventsAndDispatch(
      MeetingEventType.END_MEETING,
      currentUser,
      meeting,
    );

    return meeting;
  }

  async leaveMeeting(
    meetingId: string,
    userId: string,
    currentUser: User,
  ): Promise<Meeting> {
    const meeting = await this.meetingModel.findOne({
      _id: meetingId,
      participants: { $elemMatch: { _id: userId, isLeft: false } },
    });
    if (!meeting) {
      throw new ApolloError(
        'Meeting not found / you are not joining this meeting',
      );
    }

    const updatedMeeting = await this.meetingModel.findOneAndUpdate(
      {
        _id: meetingId,
        participants: { $elemMatch: { _id: userId } },
      },
      {
        $set: {
          'participants.$.leftAt': new Date(),
          'participants.$.isLeft': true,
        },
      },
      { useFindAndModify: true, new: true },
    );

    const usersInMeeting = updatedMeeting.participants.some((p) => !p.isLeft);

    if (!usersInMeeting) {
      await updatedMeeting.set('endedAt', new Date()).save();
    }

    await this.createMeetingEventsAndDispatch(
      MeetingEventType.LEAVE_MEETING,
      currentUser,
      updatedMeeting,
    );

    return updatedMeeting;
  }

  async blockMeetingUser(
    { initiatorId, meetingId, targetUserId }: BlockUserInput,
    currentUser: User,
  ): Promise<Meeting> {
    const meeting = await this.meetingModel.findOne({
      initiator: initiatorId,
      _id: meetingId,
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

    await this.createMeetingEventsAndDispatch(
      MeetingEventType.BLOCK_USER,
      currentUser,
      meeting,
      null,
      targetUser,
    );

    meeting.blockList.push(targetUserId);
    return await meeting.save();
  }

  async unblockMeetingUser(
    { initiatorId, meetingId, targetUserId }: BlockUserInput,
    currentUser: User,
  ): Promise<Meeting> {
    const meeting = await this.meetingModel.findOne({
      initiator: initiatorId,
      _id: meetingId,
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
    const meeting = await this.meetingModel.findOne({ _id: meetingId });
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
    const targetMeeting = await this.meetingModel.findById(meetingId);
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
      await this.userService.createUserEventsAndDispatch(
        targetUser,
        UserChannelEventType.MEETING_INVITATION,
        undefined,
        undefined,
        { meetingId, inviter: currentUser },
      );
    }

    return targetMeeting;
  }

  async createMeetingEventsAndDispatch(
    type: MeetingEventType,
    from: User,
    toMeeting: Meeting,
    message?: MeetingMessage,
    userToBeKickedOut?: User,
  ): Promise<MeetingEventsPayload> {
    const meetingEventsPayload = {
      type,
      from,
      toMeeting,
      message,
      userToBeKickedOut,
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
    const meeting = await this.meetingModel.findOne({
      _id: meetingId,
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
      _id: meetingId,
      participants: { $elemMatch: { _id: currentUser._id, isLeft: false } },
    });
    if (!meeting) {
      throw new ApolloError('Meeting not found');
    }

    const meetingMsg = {
      content,
      sentAt: new Date(),
    };

    await this.createMeetingEventsAndDispatch(
      MeetingEventType.MESSAGE,
      currentUser,
      meeting,
      meetingMsg,
    );

    return meetingMsg;
  }
}
