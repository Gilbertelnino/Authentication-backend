const sgMail = require("@sendgrid/mail");
const mailgen = require("mailgen");
const dotenv = require("dotenv");

dotenv.config();

const template = new mailgen({
  theme: "default",
  product: {
    name: "Gilbert Tek",
    link: "https://www.gilberttek.com/",
  },
});

sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const host = process.env.APP_URL;
const passwordResetURL = (user, token) =>
  `${host}/users/resetPassword/?token=${token}&email=${user.email}`;
const emailVerifytURL = (token) =>
  `${host}/users/verify/signup/?token=${token}`;
const generateEmail = (name, instructions, link) => ({
  body: {
    name,
    intro: "Welcome to Gilbert Tek! We're very excited to have you on board.",
    action: {
      instructions,
      button: {
        color: "#22BC66", // Optional action button color
        text: "Confirm your account",
        link,
      },
    },
    outro: "Elnino, Manager at Gilbert Tek",
  },
});
const generateforgotPasswordEmail = (name, instructions, link) => ({
  body: {
    name,
    action: {
      instructions,
      button: {
        color: "#FF0000", // Optional action button color
        text: "Change Password",
        link,
      },
    },
  },
});
const confirmUserTemplate = async (user, url, message) => {
  const emailBody = generateEmail(
    `${user.firstname}! Welcome to gilbert tek!`,
    message,
    `${url}`
  );
  const emailTemplate = template.generate(emailBody);

  const msg = {
    to: user.email,
    from: "gilbeltelnino@gmail.com",
    subject: "Verify Your Email",
    html: emailTemplate,
  };
  try {
    await sgMail.send(msg);
  } catch (error) {
    return "Internal server error";
  }
};
const forgotPasswordTemplate = async (user, url, message) => {
  const emailBody = generateforgotPasswordEmail(
    `${user.firstname}! You have requested to change your password`,
    message,
    `${url}`
  );
  const emailTemplate = template.generate(emailBody);

  const msg = {
    to: user.email,
    from: "gilbeltelnino@gmail.com",
    subject: "Change Password Request",
    html: emailTemplate,
  };
  try {
    await sgMail.send(msg);
  } catch (error) {
    return "Internal server error";
  }
};

module.exports = {
  confirmUserTemplate,
  emailVerifytURL,
  passwordResetURL,
  forgotPasswordTemplate,
};
