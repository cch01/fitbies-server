import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateMeetingInput } from './dto/meeting.input';
import { Meeting, MeetingDocument } from './meeting.model';

@Injectable()
export class MeetingService {
  constructor(
    @InjectModel('meeting') private meetingModel: Model<MeetingDocument>,
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
    });

    return newMeeting.save();
  }
}
