import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SessionDocument } from 'src/modules/session/session.model';
import * as moment from 'moment';
import { AuthenticationError } from 'apollo-server-express';
import { SessionService } from 'src/modules/session/session.service';
import * as _ from 'lodash';
@Injectable()
export class SessionHandler implements CanActivate {
  constructor(
    @InjectModel('session')
    protected readonly sessionModel: Model<SessionDocument>,
    protected readonly sessionService: SessionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx = GqlExecutionContext.create(context).getContext();
    const isWebSocketConnection = !!ctx.connection?.context;
    console.log('isWebSocketConnection', isWebSocketConnection);
    console.log(_.get(ctx.req, ['cookies', 'access-token']));
    const auth = isWebSocketConnection
      ? ctx.connection?.context?.webSocketAuth
      : _.get(ctx.req, ['cookies', 'access-token']);
    console.log('auth', auth);
    if (isWebSocketConnection && !auth) {
      return false;
    }

    if (!auth) {
      const guestToken = await this.sessionService.createSession();
      this.sessionService.setAccessTokenToCookie(guestToken, ctx);
      console.log('guestToken: ' + guestToken);
      ctx.token = guestToken;
      return true;
    }

    const token = auth.replace(/^Bearer\s/, '');
    console.log(token);
    const session = await this.sessionModel.findOne({
      sid: token,
    });

    if (!session) {
      this.sessionService.clearAccessToken(ctx);
      throw new AuthenticationError('Invalid Token');
    }

    if (
      (moment()
        .subtract(parseInt(process.env.LOGIN_TOKEN_EXPIRY_DAY), 'days')
        .isAfter(moment(session.lastAccess)) &&
        session.user) ||
      session.logoutAt
    ) {
      this.sessionService.clearAccessToken(ctx);
      throw new AuthenticationError('Token Expired');
    }

    await session.set('lastAccess', new Date()).save();

    ctx.user = (await session.populate('user').execPopulate())?.user;
    ctx.token = session.sid;
    console.log('user in ctx: ', ctx.user);
    return true;
  }
}
