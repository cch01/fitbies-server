import { Inject, UseGuards } from '@nestjs/common';
import { Args, Resolver, Query, ID } from '@nestjs/graphql';
import { InjectModel } from '@nestjs/mongoose';
import { ForbiddenError, PubSubEngine } from 'apollo-server-express';
import { Model } from 'mongoose';
import { SessionHandler } from 'src/guards/session.handler';
import { ActivatedUserGuard } from 'src/guards/activated.user.guard';
import { CurrentUser } from 'src/decorators/user.decorator';
import { applyConnectionArgs } from 'src/utils/apply.connection.args';
import { ConnectionArgs } from 'src/modules/common/dto/connection.args';
import { User } from 'src/modules/user/user.model';
import { UserService } from 'src/modules/user/user.service';
import { Meeting, MeetingConnection, MeetingDocument } from '../meeting.model';
import { MeetingService } from '../meeting.service';
import { GeneralUserGuard } from 'src/guards/general.user.guard';

@Resolver()
@UseGuards(SessionHandler)
export class MeetingQueriesResolver {
  constructor(
    private readonly userService: UserService,
    private readonly meetingService: MeetingService,
    @InjectModel('meeting')
    private readonly meetingModel: Model<MeetingDocument>,
  ) {}

  @Query((returns) => Meeting, { nullable: true })
  @UseGuards(GeneralUserGuard)
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
    if (!initiatorId && !isPermitToReadUser) {
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
}
