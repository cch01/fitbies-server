import { Inject, UseGuards } from '@nestjs/common';
import {
  Args,
  Mutation,
  Resolver,
  Query,
  Subscription,
  ID,
} from '@nestjs/graphql';
import { InjectModel } from '@nestjs/mongoose';
import {
  ApolloError,
  ForbiddenError,
  PubSubEngine,
} from 'apollo-server-express';
import { Model } from 'mongoose';
import { SessionHandler } from 'src/guards/session.handler';
import { ActivatedUserGuard } from 'src/guards/activated.user.guard';
import { CurrentUser } from 'src/decorators/user.decorator';
import { applyConnectionArgs } from 'src/utils/apply.connection.args';
import { ConnectionArgs } from '../common/dto/connection.args';
import { User } from '../user/user.model';
import { UserService } from '../user/user.service';
import { CreateMeetingInput, JoinMeetingInput } from './dto/meeting.input';
import { Meeting, MeetingConnection, MeetingDocument } from './meeting.model';
import { MeetingService } from './meeting.service';
import { GeneralUserGuard } from 'src/guards/general.user.guard';
import { MeetingEventsPayload } from './dto/meeting.payload';
import * as _ from 'lodash';

//TODO add pubsub dispatching on meeting resolvers / services
@Resolver((of) => Meeting)
@UseGuards(SessionHandler)
export class MeetingResolver {
  constructor(
    private readonly userService: UserService,
    private readonly meetingService: MeetingService,
    @InjectModel('meeting')
    private readonly meetingModel: Model<MeetingDocument>,
    @Inject('PUB_SUB') private readonly pubSub: PubSubEngine,
  ) {}

  @Mutation((returns) => Meeting, { nullable: true })
  @UseGuards(ActivatedUserGuard)
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
    @CurrentUser() currentUser: User,
  ) {
    if (currentUser._id != joinMeetingInput.joinerId) {
      throw new ForbiddenError('Access denied');
    }
    //TODO
    return await this.meetingService.joinMeeting(joinMeetingInput);
  }

  @Mutation((returns) => Meeting, { nullable: true })
  @UseGuards(ActivatedUserGuard)
  async endMeeting(
    @Args('meetingId', { type: () => ID }) meetingId: string,
    @CurrentUser() currentUser: User,
  ) {
    return this.meetingService.endMeeting(meetingId, currentUser);
  }

  @Mutation((returns) => Meeting, { nullable: true })
  async leaveMeeting(
    @Args('meetingId', { type: () => ID }) meetingId: string,
    @CurrentUser() currentUser: User,
  ) {
    return this.meetingService.leaveMeeting(meetingId, currentUser._id);
  }

  @Query((returns) => Meeting, { nullable: true })
  async meeting(
    @Args('meetingId', { type: () => ID }) meetingId: string,
    @CurrentUser() currentUser: User,
  ) {
    return this.meetingService.meeting(meetingId, currentUser);
  }

  @Query((returns) => MeetingConnection)
  @UseGuards(ActivatedUserGuard)
  async meetings(
    @Args('connectionArgs') connectionArgs: ConnectionArgs,
    @Args('initiatorId', { type: () => ID, nullable: true })
    initiatorId: string,
    @Args('joinerId', { type: () => ID, nullable: true }) joinerId: string,
    @CurrentUser() currentUser: User,
  ) {
    const isPermitToReadUser = await this.userService.isPermitToReadUser(
      currentUser,
      initiatorId,
    );
    if ((!initiatorId && currentUser.type != 'ADMIN') || !isPermitToReadUser) {
      throw new ForbiddenError('Access denied');
    }
    return await applyConnectionArgs(connectionArgs, this.meetingModel, {
      query: {
        ...(initiatorId && { initiator: initiatorId }),
        ...(joinerId && {
          participants: { $elemMatch: { _id: joinerId } },
        }),
      },
    });
  }

  @Subscription((returns) => MeetingEventsPayload, {
    async filter(this: MeetingResolver, { meetingChannel }, input, context) {
      return await this.meetingService.checkMeetingEventsPayload(
        meetingChannel,
        input,
        context,
      );
    },
  })
  @UseGuards(GeneralUserGuard)
  async meetingChannel(
    @Args('userId', { type: () => ID }) userId: string,
    @Args('meetingId', { type: () => ID }) meetingId: string,
    @CurrentUser() currentUser: User,
  ) {
    if (userId !== currentUser._id.toString()) {
      throw new ForbiddenError('Access denied');
    }

    const meeting = await this.meetingModel.findById(meetingId);
    if (!meeting) {
      throw new ApolloError('Meeting not found');
    }

    return this.pubSub.asyncIterator('meetingChannel');
  }
  //TODO invitation
}
