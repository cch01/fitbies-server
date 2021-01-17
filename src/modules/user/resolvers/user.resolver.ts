import { UseGuards } from '@nestjs/common';
import { Resolver, ResolveField, Parent } from '@nestjs/graphql';
import { CurrentUser } from 'src/decorators/user.decorator';
import { ActivatedUserGuard } from 'src/guards/activated.user.guard';
import { User } from '../user.model';
import { UserService } from '../user.service';
import { ForbiddenError } from 'apollo-server-express';
import { SessionHandler } from 'src/guards/session.handler';

@Resolver((of) => User)
@UseGuards(SessionHandler)
export class UserResolver {
  constructor(private readonly userService: UserService) {}

  @ResolveField((returns) => String)
  @UseGuards(ActivatedUserGuard)
  async type(@Parent() user: User, @CurrentUser() currentUser: User) {
    const isPermitToReadUser = await this.userService.isPermitToReadUser(
      currentUser,
      user._id,
    );
    if (!isPermitToReadUser) {
      throw new ForbiddenError('Access denied');
    }
    return user.type;
  }
}
