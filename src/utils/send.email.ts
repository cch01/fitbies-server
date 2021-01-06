import * as nodemailer from 'nodemailer';

const transporter =
  process.env.ENVIRONMENT === 'DEV'
    ? nodemailer.createTransport({
        host: process.env.DEV_EMAIL_HOST,
        auth: {
          user: process.env.DEV_EMAIL_USER, // generated ethereal user
          pass: process.env.DEV_EMAIL_PASSWORD, // generated ethereal password
        },
      })
    : nodemailer.createTransport({
        service: 'Gmail',
        auth: {
          user: process.env.EMAILER, // generated ethereal user
          pass: process.env.EMAILER_PASSWORD, // generated ethereal password
        },
      });

export async function sendEmail(to?: string, subject?: string, html?: string) {
  return await transporter.sendMail(
    {
      from: 'no-reply@zoomed.com',
      to: to ?? 'chanchiho01@gmail.com',
      subject: subject ?? 'test sendmail',
      html: html ?? 'Mail of test sendmail',
    },
    function (err, reply) {
      console.log(err && err.stack);
      console.dir(reply);
    },
  );
}
