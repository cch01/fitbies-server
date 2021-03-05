import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  AnonymousSignUpInput,
  ResetPasswordInput,
  SignInInput,
  SignUpInput,
  UpdateUserInput,
  UpgradeAnonymousUserInput,
} from './dto/user.input';
import { User, UserDocument, UserType } from './user.model';
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
import EmailHelper from 'src/utils/email.helper';
import * as jwt from 'jsonwebtoken';
import * as _ from 'lodash';
import { SessionDocument } from '../session/session.model';
@Injectable()
export class UserService {
  constructor(
    @InjectModel('user') private userModel: Model<UserDocument>,
    @InjectModel('session') private sessionModel: Model<SessionDocument>,
    @Inject('pubSub') private pubSub: PubSubEngine,
    private readonly sessionService: SessionService,
  ) {}

  async createUser(signUpInput: SignUpInput): Promise<User> {
    const encryptedPw = bcrypt.hashSync(
      signUpInput.password,
      bcrypt.genSaltSync(10),
    );
    const emailIsUsed = !_.isEmpty(
      await this.userModel.find({
        email: signUpInput.email,
      }),
    );
    if (emailIsUsed) {
      throw new ApolloError('This email has been used.');
    }
    const activationToken = EmailHelper.generateEmailToken({
      email: signUpInput.email,
    });
    EmailHelper.sendActivationEmail(signUpInput.email, activationToken);

    const newUser = new this.userModel({
      ...signUpInput,
      activationToken,
      password: encryptedPw,
      isActivated: false,
      type: 'CLIENT',
    });

    return newUser.save();
  }

  async activateAccount(token: string): Promise<User> {
    const user = await this.userModel.findOne({ activationToken: token });
    if (!user) throw new ApolloError('User not found');

    const { email } = jwt.verify(
      user.activationToken,
      process.env.EMAIL_TOKEN_SECRET,
    );

    if (!email || email !== user.email) {
      throw new ApolloError('Invalid token');
    }

    user.set('activationToken', null);
    user.set('activatedAt', new Date());
    return await user.set('isActivated', true).save();
  }

  async createAnonymousUser(
    input: AnonymousSignUpInput,
    token: string,
  ): Promise<User> {
    const user = new this.userModel({
      ...input,
      type: UserType.ANONYMOUS_CLIENT,
    });

    await this.sessionModel.updateOne({ sid: token }, { user: user._id });

    return await user.save();
  }

  async updateUser({ _id, ...rest }: UpdateUserInput) {
    const user = await this.userModel.findById(_id);
    if (!user) {
      throw new ApolloError('User not found');
    }

    return user.set(rest).save();
  }

  async upgradeAnonymousUser(
    { userId, ...input }: UpgradeAnonymousUserInput,
    currentUser: User,
  ): Promise<User> {
    const targetUser = await this.userModel.findById(userId);
    if (targetUser.type == UserType.CLIENT) {
      throw new ApolloError('Invalid user');
    }
    const isPermitToWrite =
      targetUser &&
      (await this.isPermitToWriteUser(currentUser, targetUser._id));

    if (!isPermitToWrite) {
      throw new ApolloError('Access denied');
    }

    const encryptedPw = bcrypt.hashSync(input.password, bcrypt.genSaltSync(10));
    const emailIsUsed = !_.isEmpty(
      await this.userModel.find({
        email: input.email,
      }),
    );
    if (emailIsUsed) {
      throw new ApolloError('This email has been used.');
    }
    const activationToken = EmailHelper.generateEmailToken({
      email: input.email,
    });
    EmailHelper.sendActivationEmail(input.email, activationToken);

    return await targetUser
      .set({
        ...input,
        activationToken,
        password: encryptedPw,
        isActivated: false,
        type: UserType.CLIENT,
      })
      .save();
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

  isAnonymousUser(user: User): boolean {
    return user.type === 'ANONYMOUS_CLIENT';
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

  async sendActivationEmail(userId: string, currentUser: User): Promise<User> {
    const isPermitToWriteUser = await this.isPermitToWriteUser(
      currentUser,
      userId,
    );
    if (!isPermitToWriteUser) {
      throw new ForbiddenError('Access denied');
    }

    const targetUser = await this.userModel.findById(userId);
    if (!targetUser) {
      throw new ApolloError('User not found');
    }

    if (!targetUser.email) {
      throw new ApolloError('User has not registered');
    }

    const activationToken = EmailHelper.generateEmailToken({
      email: targetUser.email,
    });
    EmailHelper.sendActivationEmail(targetUser.email, activationToken);
    await targetUser.set('activationToken', activationToken).save();
    return targetUser;
  }

  async isPermitToWriteUser(
    user: User,
    targetUserId: string,
  ): Promise<boolean> {
    if (!user || !targetUserId) {
      return false;
    }
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
