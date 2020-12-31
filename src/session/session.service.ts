import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, mongo } from 'mongoose';
import { UserDocument } from 'src/user/user.model';
import { SessionDocument } from './session.model';

@Injectable()
export class SessionService {
  constructor(
    @InjectModel('session') private sessionModel: Model<SessionDocument>,
    ){}

  createSession = async(userId: string): Promise<String> => {
    return (await new this.sessionModel(new mongo.ObjectID(userId)).save()).sid;
  }
}
