import * as jwt from 'jsonwebtoken';
import * as _ from 'lodash';
import { sendEmail } from './send.email';
import activationEmail from 'src/email.templates/activation';
import resetPasswordEmail from 'src/email.templates/resetPw';
import meetingInvitationEmail from 'src/email.templates/meeting.invitation';

const tokenExpiresIn = '1d';
export default class EmailHelper {
  static async sendActivationEmail(
    userEmail: string,
    activationToken: string,
    subject = 'ZOOMED account registration',
  ): Promise<void> {
    try {
      const url = `${process.env.FRONTEND_URI}/activation/${activationToken}`;

      const html = activationEmail(userEmail, url);

      await sendEmail(userEmail, subject, html);
    } catch (err) {
      console.log(err);
    }
  }
  static async sendResetPasswordEmail(
    userEmail: string,
    userName: string,
    resetToken: string,
    subject = 'Reset your ZOOMED account password',
  ): Promise<void> {
    try {
      const url = `${process.env.FRONTEND_URI}/reset/${resetToken}`;

      const html = resetPasswordEmail(userName, url);

      await sendEmail(userEmail, subject, html);
    } catch (err) {
      console.log(err);
    }
  }

  static async sendMeetingInvitationEmail(
    initiatorName: string,
    targetEmail: string,
    invitationToken: string,
    passCode?: string,
    subject = 'Invitation to join a ZOOMED meeting',
  ): Promise<void> {
    try {
      const url = `http://${process.env.FRONTEND_URI}/join/${invitationToken}`;

      const html = meetingInvitationEmail(initiatorName, url, passCode);

      await sendEmail(targetEmail, subject, html);
    } catch (err) {
      console.log(err);
    }
  }

  static generateEmailToken(content: any) {
    return jwt.sign(content, process.env.EMAIL_TOKEN_SECRET, {
      expiresIn: tokenExpiresIn,
    });
  }
}
