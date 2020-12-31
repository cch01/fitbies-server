import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SignInInput, SignUpInput, UpdateUserInput } from './dto/user.input';
import { User, UserDocument } from './user.model';
import { ApolloError, UserInputError } from 'apollo-server-express';
import * as bcrypt from 'bcrypt';
import { SessionService } from 'src/session/session.service';
import { SignInPayload } from './dto/user.payload';

@Injectable()
export class UserService {
  constructor(@InjectModel('user') private userModel: Model<UserDocument>, private readonly sessionService: SessionService) { }

  createUser = async (signUpInput: SignUpInput): Promise<User> => {
    const encryptedPw = bcrypt.hashSync(signUpInput.password, bcrypt.genSaltSync(10));
    const newUser = new this.userModel({ ...signUpInput, password: encryptedPw });
    return newUser.save();
  }

  updateUser = async (updateUserInput: UpdateUserInput) => {
    const user = await this.userModel.findById(updateUserInput._id);
    if (!user) {
      throw new ApolloError('User not found')
    }

    return user.set(updateUserInput).save();
  }

  signIn = async (signInInput: SignInInput): Promise<SignInPayload>  => {
    const user = await this.userModel.findOne({ email: signInInput.email });
    
    if(!user || (user && !this.validatePassword(user, signInInput.password))) {
      throw new ApolloError('User / password mismatch')
    }

    const token = await this.sessionService.createSession(user.id);
    console.log('token',token)
    return {
      token,
      user
    }
  }

  validatePassword = (user: User, password: string) => {
    return bcrypt.compareSync(password, user.password);
  }

  findOne = async ({ _id, email }: { _id: string, email: string }): Promise<User> => {
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
