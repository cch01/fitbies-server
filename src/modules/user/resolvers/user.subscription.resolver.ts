import { Inject, UseGuards } from '@nestjs/common';
import { Args, Resolver, ID, Subscription } from '@nestjs/graphql';
import { CurrentUser } from 'src/decorators/user.decorator';
import { ActivatedUserGuard } from 'src/guards/activated.user.guard';
import { UserChannelPayload } from '../dto/user.payload';
import { User } from '../user.model';
import { ForbiddenError } from 'apollo-server-express';
import { SessionHandler } from 'src/guards/session.handler';
import { PubSubEngine } from 'graphql-subscriptions';

@Resolver()
@UseGuards(SessionHandler)
export class UserSubscriptionsResolver {
  constructor(@Inject('pubSub') private readonly pubSub: PubSubEngine) {}

  @Subscription((returns) => UserChannelPayload, {
    filter: (payload, { userId }, context) => {
      return payload.userChannel.to._id.toString() === userId.toString();
    },
  })
  @UseGuards(ActivatedUserGuard)
  async userChannel(
    @Args('userId', { type: () => ID }) userId: string,
    @CurrentUser() currentUser: User,
  ) {
    if (userId !== currentUser._id.toString()) {
      throw new ForbiddenError('Access denied');
    }
    return this.pubSub.asyncIterator('userChannel');
  }
}
