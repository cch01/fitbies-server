import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SessionDocument } from './session.model';

@Injectable()
export class SessionService {
  constructor(
    @InjectModel('session') private sessionModel: Model<SessionDocument>,
  ) {}

  async createSession(userId?: string): Promise<string> {
    return (
      await new this.sessionModel({
        user: userId,
      }).save()
    ).sid;
  }

  async signOut(sid: string): Promise<void> {
    await this.sessionModel.findOneAndUpdate(
      { sid },
      { $set: { logoutAt: new Date() } },
    );
  }
  setAccessTokenToCookie(
    token: string,
    ctx: any,
    expires: number = parseInt(process.env.LOGIN_TOKEN_EXPIRY_DAY) *
      24 *
      60 *
      60 *
      1000,
  ): void {
    console.log('token being set', token);
    // ctx.res.clearCookie('access-token');
    ctx.res.cookie('access-token', `Bearer ${token}`, {
      maxAge: expires,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
    });
  }

  clearAccessToken(ctx: any): void {
    ctx.res.clearCookie('access-token');
  }
}
