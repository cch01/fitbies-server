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

  setAccessTokenToResponseHeader(token: string, ctx: any): void {
    console.log('token being set', token);
    ctx.res.setHeader('Access-Control-Expose-Headers', 'Authorization');
    ctx.res.setHeader('Authorization', `Bearer ${token}`);
  }
}
