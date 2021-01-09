import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SessionDocument } from 'src/modules/session/session.model';
import * as moment from 'moment';
import { AuthenticationError } from 'apollo-server-express';
import { SessionService } from 'src/modules/session/session.service';

@Injectable()
export class SessionHandler implements CanActivate {
  constructor(
    @InjectModel('session')
    protected readonly sessionModel: Model<SessionDocument>,
    protected readonly sessionService: SessionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx = GqlExecutionContext.create(context).getContext();
    if(!ctx.req) return true;
    const auth = ctx.req.cookies['access-token'];
    if (!auth) {
      const guestToken = await this.sessionService.createSession();
      this.sessionService.setAccessTokenToCookie(
        'access-token',
        guestToken,
        ctx,
      );
      return true;
    }

    const token = auth.replace(/^Bearer\s/, '');
    console.log(token);
    const session = await this.sessionModel.findOne({
      sid: token,
    });

    if (!session) {
      throw new AuthenticationError('Invalid Token');
    }

    if (
      moment()
        .subtract(parseInt(process.env.LOGIN_TOKEN_EXPIRY_DAY), 'days')
        .isAfter(moment(session.lastAccess)) &&
      session.user
    ) {
      throw new AuthenticationError('Token Expired');
    }

    await session.set('lastAccess', new Date()).save();

    this.sessionService.setAccessTokenToCookie(
      'access-token',
      session.sid,
      ctx,
    );

    ctx.user = (await session.populate('user').execPopulate())?.user;
    console.log('user in ctx: ', ctx.user);
    return true;
  }
}
