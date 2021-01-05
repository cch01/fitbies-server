import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { ApolloError, ForbiddenError } from 'apollo-server-express';
import { AuthGuard } from 'src/decorators/auth.guard';
import { CurrentUser } from 'src/decorators/user.decorator';
import { User } from '../user/user.model';
import { UserService } from '../user/user.service';
import { CreateMeetingInput, JoinMeetingInput } from './dto/meeting.input';
import { Meeting } from './meeting.model';
import { MeetingService } from './meeting.service';

@Resolver((of) => Meeting)
export class MeetingResolver {
  constructor(
    private readonly userService: UserService,
    private readonly meetingService: MeetingService,
  ) {}

  @Mutation((returns) => Meeting, { nullable: true })
  @UseGuards(AuthGuard)
  async createMeeting(
    @Args('createMeetingInput') createMeetingInput: CreateMeetingInput,
    @CurrentUser() currentUser: User,
  ): Promise<Meeting> {
    if (
      !currentUser ||
      !(await this.userService.isPermitToWrite(
        currentUser,
        createMeetingInput.initiatorId,
      ))
    ) {
      throw new ForbiddenError('Access denied');
    }

    return this.meetingService.createMeeting(createMeetingInput);
  }

  @Mutation((returns) => Meeting, { nullable: true })
  @UseGuards(AuthGuard)
  async joinMeeting(
    @Args('joinMeetingInput') joinMeetingInput: JoinMeetingInput,
  ) {
    //TODO
    return null;
  }

  //TODO invitation, end meeting, query created meetings, query self-made meeting
}
