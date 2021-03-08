import { Injectable, Scope } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as DataLoader from 'dataloader';
import { Model } from 'mongoose';
import { MeetingDocument, Meeting } from './meeting.model';

@Injectable({ scope: Scope.REQUEST })
export class MeetingLoaders {
  constructor(
    @InjectModel('meeting')
    private meetingModel: Model<MeetingDocument>,
  ) {}

  public meetingByMeetingId = new DataLoader<string, Meeting>(async (keys) => {
    try {
      const results = await this.meetingModel.find({ meetingId: keys as any });
      return keys.map((key) =>
        results.find((_user) => _user.meetingId === key),
      );
    } catch (error) {
      throw error;
    }
  });
}
