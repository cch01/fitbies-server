import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateUserInput } from './dto/user.input';
import { User, UserDocument } from './models/user.model';
import { ApolloError, UserInputError } from 'apollo-server-express';

@Injectable()
export class UserService {
  constructor(@InjectModel('user') private userModel: Model<UserDocument>) { }

  createUser = async (createUserInput: CreateUserInput) => {
    const newUser = new this.userModel(createUserInput);
    return newUser.save();
  }

  find = async ({ _id, email }: { _id: string, email: string }): Promise<User> => {
    if (!_id && !email) {
      throw new UserInputError('id or email must be provided.');
    }
    const user = await this.userModel.findOne({ ..._id && { _id }, ...email && { email } });
    if (!user) {
      throw new ApolloError('user not found');
    }
    return user;
  }
}
