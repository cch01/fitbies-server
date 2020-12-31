import { CanActivate, ExecutionContext, Inject, Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SessionDocument } from 'src/modules/session/session.model';
import { UserDocument } from 'src/modules/user/user.model';
import * as moment from 'moment';
import { AuthenticationError } from 'apollo-server-express';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @InjectModel('user') private readonly userModel: Model<UserDocument>,
    @InjectModel('session') private readonly sessionModel: Model<SessionDocument>,
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx = GqlExecutionContext.create(context).getContext();
    const auth = ctx.req.headers.Authorization || ctx.req.headers.authorization;
    if (!auth) return false;

    const token = auth.replace(/^Bearer\s/, '');

    const session = await this.sessionModel.findOne({ sid: token, lastLogin: { $gte: moment().subtract(30, 'days').toDate() } });

    if (!session) throw new AuthenticationError('Invalid token');

    await session.set('lastLogin', new Date()).save();

    const user = await this.userModel.findOne({ _id: session.userId }, { password: 0 });

    if (!user) {
      throw new AuthenticationError('Token expired')
    }

    ctx.user = user;
    return true;
  }
}