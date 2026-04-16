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

const title = "Portfolio";

const transporter = nodemailer.createTransport(options);

export const emailVerificationMail = async (user: any, otp: number) => {
  return new Promise(async (resolve, reject) => {
    try {
      const mailOptions = {
        from: mail, // sender address
        to: user.email, // list of receivers
        subject: `${title} - Email Verification`,
        html: `<html lang="en-US">
    
                <head>
                    <meta content="text/html; charset=utf-8" http-equiv="Content-Type" />
                    <title>${title} - Email Verification</title>
                    <meta name="description" content="Email Verification for ${title}.">
                    <style type="text/css">
                        a:hover {
                            text-decoration: underline !important;
                        }
                    </style>
                </head>
    
                <body marginheight="0" topmargin="0" marginwidth="0" style="margin: 0px; background-color: #f2f3f8;" leftmargin="0">
                    <!--100% body table-->
                    <table cellspacing="0" border="0" cellpadding="0" width="100%" bgcolor="#f2f3f8"
                        style="@import url(https://fonts.googleapis.com/css?family=Rubik:300,400,500,700|Open+Sans:300,400,600,700); font-family: 'Open Sans', sans-serif;">
                        <tr>
                            <td>
                                <table style="background-color: #f2f3f8; max-width:700px;  margin:0 auto;" width="100%" border="0"
                                    align="center" cellpadding="0" cellspacing="0">
                                    <tr>
                                        <td style="height:80px;">&nbsp;</td>
                                    </tr>
                                    <tr>
                                        <td style="text-align:center;">
                                            <h1
                                                style="color:#F43939; font-weight:500; margin:0;font-size:32px;font-family:'Rubik',sans-serif;">
                                                ${title}</h1>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="height:20px;">&nbsp;</td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <table width="95%" border="0" align="center" cellpadding="0" cellspacing="0"
                                                style="max-width:670px;background:#fff; border-radius:3px; text-align:center;-webkit-box-shadow:0 6px 18px 0 rgba(0,0,0,.06);-moz-box-shadow:0 6px 18px 0 rgba(0,0,0,.06);box-shadow:0 6px 18px 0 rgba(0,0,0,.06);">
                                                <tr>
                                                    <td style="height:40px;">&nbsp;</td>
                                                </tr>
                                                <tr>
                                                    <td style="padding:0 35px;">
                                                        <h1
                                                            style="color:#1e1e2d; font-weight:500; margin:0;font-size:32px;font-family:'Rubik',sans-serif;">
                                                            Email Verification</h1>
                                                        <span
                                                            style="display:inline-block; vertical-align:middle; margin:29px 0 26px; border-bottom:1px solid #cecece; width:100px;"></span>
                                                        <p style="color:#455056; font-size:15px;line-height:24px; margin:0;">
                                                            Hi ${user.firstName + " " + user.lastName != null ? user.firstName + " " + user.lastName : "dear"}, 
                                                            <br>
                                                            Welcome to the ${title}! Please verify your email to continue.
                                                            <br>
                                                            OTP will expire in 10 minutes.
                                                            <br>
                                                            Verification code: ${otp}
                                                            <br>
                                                            <br>
                                                            The ${title} Team
                                                        </p>
    
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td style="height:40px;">&nbsp;</td>
                                                </tr>
                                            </table>
                                        </td>
                                    <tr>
                                        <td style="height:20px;">&nbsp;</td>
                                    </tr>
                                    <tr>
                                        <td style="text-align:center;">
                                            <strong></strong></p>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="height:80px;">&nbsp;</td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                    <!--/100% body table-->
                </body>
    
                </html>`,
      };
      await transporter.sendMail(mailOptions, function (err, data) {
        if (err) {
          console.error(err);
          reject(err);
        } else {
          resolve(`Email has been sent to ${user.email}, kindly follow the instructions`);
        }
      });
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
};

export const forgotPasswordOtpMail = async (user: any, otp: number) => {
  return new Promise(async (resolve, reject) => {
    try {
      const mailOptions = {
        from: mail,
        to: user.email,
        subject: `${title} - Forgot Password OTP`,
        html: `
          <html>
            <body style="font-family: Arial, sans-serif; color: #111;">
              <h2>${title} - Password Reset</h2>
              <p>Your OTP for password reset is:</p>
              <h1 style="letter-spacing: 4px;">${otp}</h1>
              <p>This OTP will expire in 10 minutes.</p>
            </body>
          </html>
        `,
      };

      await transporter.sendMail(mailOptions, function (err) {
        if (err) {
          console.error(err);
          reject(err);
        } else {
          resolve(`Email has been sent to ${user.email}`);
        }
      });
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
};

export const loginOtpMail = async (user: any, otp: number) => {
  return new Promise(async (resolve, reject) => {
    try {
      const mailOptions = {
        from: mail,
        to: user.email,
        subject: `${title} - Login OTP`,
        html: `
          <html>
            <body style="font-family: Arial, sans-serif; color: #111;">
              <h2>${title} - Login Verification</h2>
              <p>Your OTP for login is:</p>
              <h1 style="letter-spacing: 4px;">${otp}</h1>
              <p>This OTP will expire in 10 minutes.</p>
            </body>
          </html>
        `,
      };

      await transporter.sendMail(mailOptions, function (err) {
        if (err) {
          console.error(err);
          reject(err);
        } else {
          resolve(`Email has been sent to ${user.email}`);
        }
      });
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
};
