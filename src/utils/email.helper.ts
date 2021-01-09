import * as jwt from 'jsonwebtoken';
import * as _ from 'lodash';
import { sendEmail } from './send.email';
import activationEmail from 'src/email.templates/activation';
import resetPasswordEmail from 'src/email.templates/resetPw';
import meetingInvitationEmail from 'src/email.templates/meeting.invatation';

const tokenExpiresIn = '1d';
export default class EmailHelper {
  static async sendActivationEmail(
    userEmail: string,
    subject: string,
    activationToken: string,
  ): Promise<void> {
    try {
      const url = `${process.env.SERVER_URI}/activation/${activationToken}`;

      const html = activationEmail(userEmail, url);

      await sendEmail(userEmail, subject, html);
    } catch (err) {
      console.log(err);
    }
  }
  static async sendResetPasswordEmail(
    userEmail: string,
    userName: string,
    subject: string,
    resetToken: string,
  ): Promise<void> {
    try {
      const url = `${process.env.SERVER_URI}/reset/${resetToken}`;

      const html = resetPasswordEmail(userName, url);

      await sendEmail(userEmail, subject, html);
    } catch (err) {
      console.log(err);
    }
  }

  static async sendMeetingInvitationEmail(
    initiatorName: string,
    targetEmail: string,
    subject: string,
    invitationToken: string,
    passCode?: string,
  ): Promise<void> {
    try {
      const url = `${process.env.SERVER_URI}/reset/${invitationToken}`;

      const html = meetingInvitationEmail(initiatorName, url, passCode);

      await sendEmail(targetEmail, subject, html);
    } catch (err) {
      console.log(err);
    }
  }

  static generateEmailToken(plainText: string) {
    return jwt.sign(plainText, process.env.EMAIL_TOKEN_SECRET, {
      expiresIn: tokenExpiresIn,
    });
  }
}
