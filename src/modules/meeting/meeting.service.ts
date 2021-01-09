import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ApolloError, ForbiddenError } from 'apollo-server-express';
import { Model } from 'mongoose';
import { User } from '../user/user.model';
import { UserService } from '../user/user.service';
import { CreateMeetingInput, JoinMeetingInput } from './dto/meeting.input';
import { Meeting, MeetingDocument } from './meeting.model';

@Injectable()
export class MeetingService {
  constructor(
    @InjectModel('meeting') private meetingModel: Model<MeetingDocument>,
    private readonly userService: UserService,
  ) {}

  async createMeeting({
    initiatorId: initiator,
    passCode,
    needApproval,
  }: CreateMeetingInput): Promise<Meeting> {
    const newMeeting = new this.meetingModel({
      initiator,
      passCode,
      needApproval,
      participants: [{ _id: initiator, approvedAt: new Date() }],
    });

    const result = await (await newMeeting.save())
      .populate('initiator')
      .execPopulate();
    return result;
  }

  async joinMeeting({
    meetingId,
    joinerId,
    passCode,
  }: JoinMeetingInput): Promise<Meeting> {
    //TODO: subscription
    const meeting = await (
      await this.meetingModel.findOne({ _id: meetingId })?.populate('initiator')
    )?.execPopulate();

    if (!meeting || meeting.endedAt) {
      throw new ApolloError('Meeting not found.');
    }

    if (meeting.passCode && meeting.passCode !== passCode) {
      throw new ForbiddenError('Wrong pass code.');
    }

    if (meeting.needApproval) {
      //TODO push to creator for approval
    }
    let updatedMeeting;
    const joinedRecord = meeting.participants.find((_p) => _p._id == joinerId);

    //TODO refactor needed
    if (!joinedRecord) {
      const newRecord = { _id: joinerId, approvedAt: new Date() };
      meeting.participants.push(newRecord);
      updatedMeeting = await meeting.save();
    } else {
      updatedMeeting = await this.meetingModel.findOneAndUpdate(
        {
          _id: meetingId,
          participants: { $elemMatch: { _id: joinerId } },
        },
        {
          $set: { 'participants.$.approvedAt': new Date() },
        },
        { useFindAndModify: true, new: true },
      );
    }
    return updatedMeeting;
  }

  async endMeeting(meetingId: string, currentUser: User): Promise<Meeting> {
    const meeting = await this.meetingModel.findById(meetingId);
    if (!meeting) {
      throw new ApolloError('meeting not found');
    }
    const isPermitToWriteUser = await this.userService.isPermitToWriteUser(
      currentUser,
      meeting.initiator,
    );

    if (!isPermitToWriteUser) {
      throw new ForbiddenError('Access denied');
    }
    if (meeting.endedAt) {
      throw new ApolloError('meeting has been ended already');
    }

    const updatedParticipants = meeting.toObject().participants.map((_p) => ({
      ..._p,
      isLeft: true,
      leftAt: _p.isLeft ? _p.leftAt : new Date(),
    }));

    return meeting
      .set({ endedAt: new Date(), participants: updatedParticipants })
      .save();
  }

  async leaveMeeting(meetingId: string, userId: string): Promise<Meeting> {
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

    return updatedMeeting;
  }

  async meeting(meetingId: string, currentUser: User): Promise<Meeting> {
    const meeting = await this.meetingModel.findOne({ _id: meetingId });

    const isPermitToReadUser = await this.userService.isPermitToReadUser(
      currentUser,
      meeting._id,
    );

    if (!isPermitToReadUser) {
      throw new ForbiddenError('Access denied');
    }

    return meeting;
  }
}
