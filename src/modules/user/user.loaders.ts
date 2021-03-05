import { Injectable, Scope } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as DataLoader from 'dataloader';
import { Model } from 'mongoose';
import { User, UserDocument } from './user.model';

@Injectable({ scope: Scope.REQUEST })
export class UserLoaders {
  constructor(
    @InjectModel('user') private readonly userModel: Model<UserDocument>,
  ) {}

  public readonly user = new DataLoader<string, User>(
    async (keys) => {
      try {
        const results = await this.userModel.find({ _id: keys });
        return keys.map((key) =>
          results.find((_user) => _user._id.toString() === key.toString()),
        );
      } catch (error) {
        throw error;
      }
    },
    { cacheKeyFn: (key) => key.toString() },
  );
}
