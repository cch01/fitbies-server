import { UserDocument } from 'src/modules/user/user.model';
import * as jwt from 'jsonwebtoken';
import * as _ from 'lodash';
import { sendEmail } from './send.email';
import activationEmail from 'src/email.templates/activation';
import resetPasswordEmail from 'src/email.templates/resetPw';
import meetingInvitationEmail from 'src/email.templates/meeting.invatation';

export default class EmailHelper {
  static async sendActivationEmail(
    user: UserDocument,
    subject: string,
  ): Promise<void> {
    try {
      const activationToken = jwt.sign(
        { user: user.email },
        process.env.EMAIL_SECRET,
        {
          expiresIn: '1d',
        },
      );

      const url = `localhost:4000/activation/${activationToken}`;

      const html = activationEmail(user.lastName, url);

      await sendEmail(user.email, subject, html);

      await user.set({ activationToken }).save();
    } catch (err) {
      console.log(err);
    }
  }
  static async sendResetPasswordEmail(
    user: UserDocument,
    subject: string,
  ): Promise<void> {
    try {
      const resetToken = jwt.sign(
        { user: user.email },
        process.env.EMAIL_SECRET,
        {
          expiresIn: '1d',
        },
      );

      const url = `localhost:4000/reset/${resetToken}`;

      const html = resetPasswordEmail(user.lastName, url);

      await sendEmail(user.email, subject, html);

      await user.set({ resetToken }).save();
    } catch (err) {
      console.log(err);
    }
  }

  static async sendMeetingInvitationEmail(
    initiator: UserDocument,
    targetUser: UserDocument,
    subject: string,
    passcode?: string,
  ): Promise<void> {
    try {
      const invitationToken = jwt.sign(
        { user: targetUser.email },
        process.env.EMAIL_SECRET,
        {
          expiresIn: '1d',
        },
      );

      const url = `localhost:4000/reset/${invitationToken}`;

      const html = meetingInvitationEmail(initiator.lastName, url, passcode);

      await sendEmail(targetUser.email, subject, html);

      await initiator.set({ invitationToken }).save();
    } catch (err) {
      console.log(err);
    }
  }
}
