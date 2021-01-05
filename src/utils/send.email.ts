import * as nodemailer from 'nodemailer';

console.log(process.env.EMAILER, process.env.EMAILER_PW);
const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.EMAILER, // generated ethereal user
    pass: process.env.EMAILER_PW, // generated ethereal password
  },
});

export async function sendEmail(
  from?: string,
  to?: string,
  subject?: string,
  html?: string,
) {
  return await transporter.sendMail(
    {
      from: from ?? 'no-reply@zoomed.com',
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
