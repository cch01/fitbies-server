import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ResetPasswordInput,
  SignInInput,
  SignUpInput,
  UpdateUserInput,
} from './dto/user.input';
import { User, UserDocument } from './user.model';
import {
  ApolloError,
  ForbiddenError,
  PubSubEngine,
  UserInputError,
} from 'apollo-server-express';
import * as bcrypt from 'bcrypt';
import { SessionService } from 'src/modules/session/session.service';
import {
  MeetingInvitation,
  PersonalMessage,
  SignInPayload,
  UserChannelEventType,
  UserChannelPayload,
  UserState,
} from './dto/user.payload';
@Injectable()
export class UserService {
  constructor(
    @InjectModel('user') private userModel: Model<UserDocument>,
    @Inject('pubSub') private pubSub: PubSubEngine,
    private readonly sessionService: SessionService,
  ) {}

  async createUser(signUpInput: SignUpInput): Promise<User> {
    const encryptedPw = bcrypt.hashSync(
      signUpInput.password,
      bcrypt.genSaltSync(10),
    );
    const newUser = new this.userModel({
      ...signUpInput,
      password: encryptedPw,
      isActivated: true,
    });
    return newUser.save();
  }

  async updateUser({ _id, ...rest }: UpdateUserInput) {
    const user = await this.userModel.findById(_id);
    if (!user) {
      throw new ApolloError('User not found');
    }

    return user.set(rest).save();
  }

  async signIn(signInInput: SignInInput): Promise<SignInPayload> {
    const user = await this.userModel.findOne({ email: signInInput.email });
    console.log('user trying to login: ', user);
    if (!user || (user && !this.validatePassword(user, signInInput.password))) {
      throw new ApolloError('User / password mismatch');
    }

    const token = await this.sessionService.createSession(user.id);
    console.log('token created', token);
    return {
      token,
      user,
    };
  }

  validatePassword(user: User, password: string): boolean {
    return bcrypt.compareSync(password, user.password);
  }

  createUserEventsAndDispatch(
    to: User,
    eventType: UserChannelEventType,
    personalMessage?: PersonalMessage,
    friendState?: UserState,
    meetingInvitation?: MeetingInvitation,
  ): UserChannelPayload {
    const userEventPayload = {
      to,
      eventType,
      personalMessage,
      friendState,
      meetingInvitation,
    };
    this.pubSub.publish('userChannel', { userChannel: userEventPayload });
    return userEventPayload;
  }

  async user(
    currentUser: User,
    { _id, email }: { _id: string; email: string },
  ): Promise<User> {
    if (!_id && !email) {
      throw new UserInputError('id or email must be provided.');
    }

    if (!currentUser) {
      throw new ForbiddenError('Access denied.');
    }
    const user = await this.userModel.findOne({
      ...(_id && { _id }),
      ...(email && { email }),
    });

    if (!user) {
      throw new ApolloError('user not found');
    }

    if (!(await this.isPermitToReadUser(currentUser, user._id))) {
      throw new ForbiddenError('Access denied');
    }
    return user;
  }

  async isPermitToReadUser(user: User, targetUserId: string): Promise<boolean> {
    switch (user.type) {
      case 'ADMIN':
        return true;
      default:
        if (!user || user._id.toString() != targetUserId) return false;
    }
    return true;
  }

  isAdmin(user: User): boolean {
    return user.type === 'ADMIN';
  }

  isClient(user: User): boolean {
    return user.type === 'CLIENT';
  }

  async resetPassword(
    currentUser: User,
    { email, oldPassword, newPassword, confirmPassword }: ResetPasswordInput,
  ): Promise<User> {
    const targetUser = await this.userModel.findOne({ email });
    if (!targetUser) {
      throw new ApolloError('User not found');
    }

    const isPermitToWriteUser = await this.isPermitToWriteUser(
      currentUser,
      targetUser._id,
    );

    if (!isPermitToWriteUser) {
      throw new ForbiddenError('Access denied');
    }

    const isPasswordCorrect = bcrypt.compareSync(
      oldPassword,
      targetUser.password,
    );

    if (!isPasswordCorrect) {
      throw new UserInputError('Incorrect password');
    }

    if (confirmPassword !== newPassword) {
      throw new UserInputError('Invalid new passwords');
    }
    const newPasswordHash = bcrypt.hashSync(
      newPassword,
      bcrypt.genSaltSync(10),
    );

    return await targetUser.set('password', newPasswordHash).save();
  }

  async isPermitToWriteUser(
    user: User,
    targetUserId: string,
  ): Promise<boolean> {
    switch (user.type) {
      case 'ADMIN':
        return true;
      default:
        if (!user || user._id.toString() != targetUserId.toString())
          return false;
    }
    return true;
  }
}
