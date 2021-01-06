import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Resolver, Query } from '@nestjs/graphql';
import { InjectModel } from '@nestjs/mongoose';
import { ApolloError, ForbiddenError } from 'apollo-server-express';
import { Model } from 'mongoose';
import { AuthGuard } from 'src/decorators/auth.guard';
import { CurrentUser } from 'src/decorators/user.decorator';
import { applyConnectionArgs } from 'src/utils/apply.connection.args';
import { ConnectionArgs } from '../common/dto/connection.args';
import { User } from '../user/user.model';
import { UserService } from '../user/user.service';
import { CreateMeetingInput, JoinMeetingInput } from './dto/meeting.input';
import { Meeting, MeetingConnection, MeetingDocument } from './meeting.model';
import { MeetingService } from './meeting.service';

@Resolver((of) => Meeting)
@UseGuards(AuthGuard)
export class MeetingResolver {
  constructor(
    private readonly userService: UserService,
    private readonly meetingService: MeetingService,
    @InjectModel('meeting')
    private readonly meetingModel: Model<MeetingDocument>,
  ) {}

  @Mutation((returns) => Meeting, { nullable: true })
  async createMeeting(
    @Args('createMeetingInput') createMeetingInput: CreateMeetingInput,
    @CurrentUser() currentUser: User,
  ): Promise<Meeting> {
    const isPermitToWriteUser = await this.userService.isPermitToWriteUser(
      currentUser,
      createMeetingInput.initiatorId,
    );
    if (!isPermitToWriteUser) {
      throw new ForbiddenError('Access denied');
    }

    return this.meetingService.createMeeting(createMeetingInput);
  }

  @Mutation((returns) => Meeting, { nullable: true })
  async joinMeeting(
    @Args('joinMeetingInput') joinMeetingInput: JoinMeetingInput,
  ) {
    //TODO
    return await this.meetingService.joinMeeting(joinMeetingInput);
  }

  @Mutation((returns) => Meeting, { nullable: true })
  async endMeeting(
    @Args('meetingId') meetingId: string,
    @CurrentUser() currentUser: User,
  ) {
    return this.meetingService.endMeeting(meetingId, currentUser);
  }

  @Mutation((returns) => Meeting, { nullable: true })
  async leaveMeeting(
    @Args('meetingId') meetingId: string,
    @CurrentUser() currentUser: User,
  ) {
    return this.meetingService.leaveMeeting(meetingId, currentUser._id);
  }

  @Query((returns) => Meeting, { nullable: true })
  async meeting(
    @Args('meetingId') meetingId: string,
    @CurrentUser() currentUser: User,
  ) {
    return this.meetingService.meeting(meetingId, currentUser);
  }

  @Query((returns) => MeetingConnection)
  async meetings(
    @Args('connectionArgs') connectionArgs: ConnectionArgs,
    @Args('userId', { nullable: true }) userId: string,
    @CurrentUser() currentUser: User,
  ) {
    const isPermitToReadUser = await this.userService.isPermitToReadUser(
      currentUser,
      userId,
    );
    if ((!userId && currentUser.type != 'ADMIN') || !isPermitToReadUser) {
      throw new ForbiddenError('Access denied');
    }
    return await applyConnectionArgs(connectionArgs, this.meetingModel, {
      query: userId && { initiator: userId },
    });
  }
  //TODO invitation
}
