import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SessionDocument } from './session.model';

@Injectable()
export class SessionService {
  constructor(
    @InjectModel('session') private sessionModel: Model<SessionDocument>,
  ) {}

  async createSession(userId: string): Promise<string> {
    return (await new this.sessionModel({ user: userId }).save()).sid;
  }
}
