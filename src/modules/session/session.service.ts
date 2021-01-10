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
  setAccessTokenToCookie(
    name: string,
    token: string,
    ctx: any,
    expires: number = parseInt(process.env.LOGIN_TOKEN_EXPIRY_DAY) *
      24 *
      60 *
      60 *
      1000,
  ): void {
    ctx.res.cookie(name, `Bearer ${token}`, {
      maxAge: expires,
      httpOnly: true,
      secure: process.env.NODE_ENVIRONMENT != 'DEV' && true,
    });
  }
}
