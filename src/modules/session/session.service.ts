import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, mongo } from 'mongoose';
import { UserDocument } from 'src/modules/user/user.model';
import { SessionDocument } from './session.model';

@Injectable()
export class SessionService {
  constructor(
    @InjectModel('session') private sessionModel: Model<SessionDocument>,
  ) { }

  async createSession(userId: string): Promise<String> {
    return (await new this.sessionModel({ user: userId }).save()).sid;
  }
}
