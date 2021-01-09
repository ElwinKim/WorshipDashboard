const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // 1) Create a transporter
  var transport = nodemailer.createTransport({
    host: 'smtp.mailtrap.io',
    port: 2525,
    auth: {
      user: 'a50c2ebf7f0b46',
      pass: '1397a0a4e23011',
    },
  });

  // 2) Define the email options
  const mailOptions = {
    from: 'Elwin Kim <hello@gmail.com>',
    to: options.email,
    subject: options.subject,
    text: options.message,
  };
  // 3) Actually send the email
  await transport.sendMail(mailOptions);
};

module.exports = sendEmail;
