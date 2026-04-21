import nodemailer from "nodemailer";

let mail = process.env.MAIL;
let password = process.env.MAIL_PASSWORD;

const options = {
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: mail,
    pass: password,
  },
};

const title = "Zazzi App";
const primaryColor = "#F43939"; // Red from screenshot

const transporter = nodemailer.createTransport(options);

const getHtmlTemplate = (user: any, otp: number, subject: string, message: string) => {
    const name = user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : "User";
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${subject}</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7ff; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
        .wrapper { width: 100%; table-layout: fixed; background-color: #f4f7ff; padding-bottom: 40px; }
        .main-table { width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; margin-top: 40px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .header { background-color: ${primaryColor}; padding: 30px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 28px; letter-spacing: 1px; }
        .content { padding: 40px 30px; color: #333333; line-height: 1.6; }
        .content h2 { color: #111111; font-size: 20px; margin-top: 0; }
        .otp-container { background-color: #f2f5ff; border-radius: 6px; padding: 30px; text-align: center; margin: 30px 0; }
        .otp-code { font-size: 36px; font-weight: bold; color: ${primaryColor}; letter-spacing: 8px; margin: 0; }
        .footer { padding: 0 30px 40px 30px; color: #666666; font-size: 14px; }
        .footer p { margin: 5px 0; }
        .validity { display: flex; align-items: center; justify-content: start; color: #666; margin-top: 20px; }
        .validity-icon { margin-right: 8px; font-size: 16px; }
    </style>
</head>
<body>
    <div class="wrapper">
        <table class="main-table" cellpadding="0" cellspacing="0">
            <tr>
                <td class="header">
                    <h1>${title}</h1>
                </td>
            </tr>
            <tr>
                <td class="content">
                    <h2>${subject}</h2>
                    <p>Thank you for choosing <strong>${title}</strong>.</p>
                    <p>${message}</p>
                    
                    <div class="otp-container">
                        <p class="otp-code">${otp}</p>
                    </div>

                    <div class="validity">
                        <span class="validity-icon">⏱</span> This OTP is valid for <strong>10 minutes</strong>.
                    </div>
                </td>
            </tr>
            <tr>
                <td class="footer">
                    <p>If you did not request this verification, please ignore this email.</p>
                    <br>
                    <p>Regards,</p>
                    <p><strong>The ${title} Team</strong></p>
                </td>
            </tr>
        </table>
    </div>
</body>
</html>`;
};

export const emailVerificationMail = async (user: any, otp: number) => {
  return new Promise(async (resolve, reject) => {
    try {
      const subject = "Email Verification";
      const message = "Please use the OTP below to verify your email address:";
      const mailOptions = {
        from: mail,
        to: user.email,
        subject: `${title} - ${subject}`,
        html: getHtmlTemplate(user, otp, subject, message),
      };
      
      await transporter.sendMail(mailOptions, (err) => {
        if (err) { reject(err); } else { resolve(`Email has been sent to ${user.email}`); }
      });
    } catch (error) { reject(error); }
  });
};

export const forgotPasswordOtpMail = async (user: any, otp: number) => {
  return new Promise(async (resolve, reject) => {
    try {
      const subject = "Reset Your Password";
      const message = "We received a request to reset your password. Use the code below to proceed:";
      const mailOptions = {
        from: mail,
        to: user.email,
        subject: `${title} - ${subject}`,
        html: getHtmlTemplate(user, otp, subject, message),
      };

      await transporter.sendMail(mailOptions, (err) => {
        if (err) { reject(err); } else { resolve(`Email has been sent to ${user.email}`); }
      });
    } catch (error) { reject(error); }
  });
};

export const loginOtpMail = async (user, otp: number) => {
  return new Promise(async (resolve, reject) => {
    try {
      const subject = "Login Verification";
      const message = "Your one-time password for secure login is:";
      const mailOptions = {
        from: mail,
        to: user.email,
        subject: `${title} - ${subject}`,
        html: getHtmlTemplate(user, otp, subject, message),
      };

      await transporter.sendMail(mailOptions, (err) => {
        if (err) { reject(err); } else { resolve(`Email has been sent to ${user.email}`); }
      });
    } catch (error) { reject(error); }
  });
};
