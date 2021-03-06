import { Injectable, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { PubSubEngine } from 'graphql-subscriptions';
import { Model } from 'mongoose';
import { UserDocument } from '../user/user.model';
import { UserService } from '../user/user.service';
import { MeetingDocument } from './meeting.model';
import { blockMeetingUser } from './services/blockMeetingUser';
import { checkMeetingEventsPayload } from './services/checkMeetingEventsPayload';
import { endMeeting } from './services/endMeeting';
import { hostMeeting } from './services/hostMeeting';
import { inviteUserToMeeting } from './services/inviteUserToMeeting';
import { joinMeeting } from './services/joinMeeting';
import { leaveMeeting } from './services/leaveMeeting';
import { meeting } from './services/meeting';
import { sendMeetingMessage } from './services/sendMeetingMessage';
import { toggleMeetingMicAndCam } from './services/toggleMeetingMicAndCam';
import { toggleParticipantMicAndCam } from './services/toggleParticipantMicAndCam';
import { unblockMeetingUser } from './services/unblockMeetingUser';

export interface MeetingServiceCtx {
  meetingModel: Model<MeetingDocument>;
  userModel: Model<UserDocument>;
  pubSub: PubSubEngine;
  userService: UserService;
}

@Injectable()
export class MeetingService {
  constructor(
    @InjectModel('meeting') private meetingModel: Model<MeetingDocument>,
    @InjectModel('user') private userModel: Model<UserDocument>,
    @Inject('pubSub') private readonly pubSub: PubSubEngine,
    private readonly userService: UserService,
  ) {}

  private readonly ctx = {
    meetingModel: this.meetingModel,
    userModel: this.userModel,
    pubSub: this.pubSub,
    userService: this.userService,
  };

  blockMeetingUser = blockMeetingUser(this.ctx);

  checkMeetingEventsPayload = checkMeetingEventsPayload(this.ctx);

  endMeeting = endMeeting(this.ctx);

  hostMeeting = hostMeeting(this.ctx);

  inviteUserToMeeting = inviteUserToMeeting(this.ctx);

  joinMeeting = joinMeeting(this.ctx);

  leaveMeeting = leaveMeeting(this.ctx);

  meeting = meeting(this.ctx);

  sendMeetingMessage = sendMeetingMessage(this.ctx);

  toggleMeetingMicAndCam = toggleMeetingMicAndCam(this.ctx);

  toggleParticipantMicAndCam = toggleParticipantMicAndCam(this.ctx);

  unblockMeetingUser = unblockMeetingUser(this.ctx);
}
