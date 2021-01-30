import { UseGuards } from '@nestjs/common';
import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { InjectModel } from '@nestjs/mongoose';
import { ForbiddenError } from 'apollo-server-express';
import { Model } from 'mongoose';
import { CurrentUser } from 'src/decorators/user.decorator';
import { ActivatedUserGuard } from 'src/guards/activated.user.guard';
import { GeneralUserGuard } from 'src/guards/general.user.guard';
import { User, UserDocument } from 'src/modules/user/user.model';
import { UserService } from 'src/modules/user/user.service';
import { Meeting, Participant } from '../meeting.model';

@Resolver((of) => Meeting)
export class MeetingResolver {
  constructor(
    private readonly userService: UserService,
    @InjectModel('user') private readonly userModel: Model<UserDocument>,
  ) {}

  @ResolveField((returns) => String)
  @UseGuards(ActivatedUserGuard)
  async passCode(
    @Parent() meeting: Meeting,
    @CurrentUser() currentUser: User,
  ): Promise<string> {
    const isPermitToReadUser = await this.userService.isPermitToReadUser(
      currentUser,
      meeting.initiator,
    );

    if (!isPermitToReadUser) {
      throw new ForbiddenError('Access denied');
    }
    return meeting.passCode;
  }

  @ResolveField((returns) => String)
  @UseGuards(GeneralUserGuard)
  async initiator(@Parent() meeting: Meeting): Promise<User> {
    return this.userModel.findById(meeting.initiator);
  }

  @ResolveField((returns) => String)
  @UseGuards(ActivatedUserGuard)
  async blockList(
    @Parent() meeting: Meeting,
    @CurrentUser() currentUser: User,
  ): Promise<string[]> {
    const isPermitToReadUser = await this.userService.isPermitToReadUser(
      currentUser,
      meeting.initiator,
    );

    if (!isPermitToReadUser) {
      throw new ForbiddenError('Access denied');
    }
    return meeting.blockList;
  }
  // TODO: dataloader
  @ResolveField((returns) => String)
  @UseGuards(GeneralUserGuard)
  async participants(@Parent() meeting: Meeting): Promise<Participant[]> {
    const result = await Promise.all(
      meeting.participants.map(async (p) => {
        return await this.userModel.findById(p._id);
      }),
    );
    return await result;
  }

  @ResolveField((returns) => String)
  @UseGuards(GeneralUserGuard)
  async roomId(
    @Parent() meeting: Meeting,
    @CurrentUser() currentUser: User,
  ): Promise<string> {
    const isUserJoined = !!meeting.participants.find(
      (participant) =>
        participant._id.toString() === currentUser._id.toString(),
    );
    if (!isUserJoined && !this.userService.isAdmin(currentUser)) {
      throw new ForbiddenError('Access denied');
    }

    return meeting.roomId;
  }
}
