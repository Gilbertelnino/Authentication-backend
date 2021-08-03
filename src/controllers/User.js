const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const {
  signAccessToken,
  signRefreshToken,
  signNewAccessToken,
} = require("../helper/jwt_helper");
const { generateToken } = require("../middlewares/verifyToken");
const {
  emailVerifytURL,
  confirmUserTemplate,
  forgotPasswordTemplate,
  passwordResetURL,
} = require("../helper/email");
const User = require("../database/models/User");
const { onError, onSuccess } = require("../utils/response");
const client = require("../helper/redis_config");
const { encryptPassword, verifyLink } = require("../helper/auth");
class Users {
  // get users
  static async getUsers(req, res) {
    try {
      const users = await User.find({});
      if (users.length === 0) {
        return onError(res, 404, "Not User yet!");
      } else {
        return onSuccess(res, 200, "All users Fetched Successfully", users);
      }
    } catch (error) {
      return onError(res, 500, "Internal server error");
    }
  }
  // register user
  static async registerUser(req, res) {
    try {
      const user = {
        firstname: req.body.firstname,
        lastname: req.body.lastname,
        email: req.body.email,
        password: req.body.password,
      };
      const token = generateToken(user);
      const url = emailVerifytURL(token);
      confirmUserTemplate(
        user,
        url,
        "Verify you email to continue! Note: This email is only valid for 1 hour!"
      );
      return onSuccess(
        res,
        200,
        `Hello, ${user.firstname} Check a verification link in your email . Note: email will be expired in 1 hour`
      );
    } catch (error) {
      return onError(res, 500, "internal server error");
    }
  }

  // create user after verification
  static async verifyUser(req, res) {
    try {
      // decode jwt from Url
      const userToken = req.query.token;

      const userInfo = jwt.decode(userToken, process.env.TOKEN_SECRET_KEY);

      // distructuring user info
      const { firstname, lastname, email, password } = userInfo.payload;
      // check user if is already an exist

      const emailExist = await User.findOne({ email });
      if (emailExist)
        return onError(
          res,
          400,
          `Hi, ${firstname} your account is already Verified!`
        );

      // Hash passwords

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const newuser = await User({
        isVerified: true,
        firstname,
        lastname,
        email,
        password: hashedPassword,
      });
      await newuser.save();
      signAccessToken(newuser);
      return onSuccess(
        res,
        201,
        `You are Welcome ${newuser.firstname}! your account have been verified successfully, now you can login`
      );
    } catch (err) {
      return onError(res, 500, "Internal Server error");
    }
  }
  // confirm email

  static async loginUser(req, res) {
    // check if password is correct
    try {
      const user = await User.findOne({ email: req.body.email });

      const validPassword = await bcrypt.compare(
        req.body.password,
        user.password
      );
      if (!validPassword) return onError(res, 401, "Invalid Email or Password");
      const accessToken = await signAccessToken(user);
      const refreshToken = await signRefreshToken(user);
      return res.status(201).json({
        accessToken,
        refreshToken,
        message: "You Logged in successfully",
      });
    } catch (error) {
      return onError(res, 500, "Internal Server Error");
    }
  }
  // renew Access Token

  static async renewAccessToken(req, res) {
    try {
      const user = await User.findOne({ _id: req.params.id });
      client.get(`refreshToken-${user._id}`, (err, value) => {
        if (err) return onError(res, 401, "Unauthorized Action");
        if (!value) return onError(res, 401, "Unauthorized Action");
        jwt.verify(value, process.env.REFRESH_TOKEN, (error, user) => {
          if (error) {
            return onError(res, 401, "Unauthorized Behavior");
          } else {
            const accessToken = signNewAccessToken(user.payload);
            return res.status(201).json({
              accessToken,
              message: "Token renewed Successfully",
            });
          }
        });
      });
    } catch (error) {
      return onError(res, 500, "Internal Server Error");
    }
  }

  static async logout(req, res) {
    try {
      const { id: userId } = req.user;
      client.del(`refreshToken-${userId}`);
      client.del(`accessToken-${userId}`);
      return onSuccess(res, 200, "You logged out successfully.");
    } catch (error) {
      return onError(res, 500, "Internal Server Error");
    }
  }
  static async deleteUser(req, res) {
    try {
      const user = await User.findOne({ _id: req.params.id });
      if (!user) return onError(res, 404, "user doesn't exist");
      else {
        await user.destroy();
        return onSuccess(res, 200, "user deleted successfully");
      }
    } catch (error) {
      return onError(res, 500, "Internal Server Error");
    }
  }

  // Forgot password and reset password

  static async forgetPassword(req, res) {
    try {
      const { email } = req.body;
      const foundUser = await User.findOne({ email });
      if (foundUser) {
        const token = jwt.sign(
          { email: foundUser.email, id: foundUser._id },
          foundUser.password,
          {
            expiresIn: "24h",
          }
        );
        const resetUrl = passwordResetURL(foundUser, token);
        forgotPasswordTemplate(
          foundUser,
          resetUrl,
          "we have recieved change password request if it was you click the link below, otherwise ignore this email"
        );
        return onSuccess(res, 200, "check you email to change password");
      } else {
        return onError(res, 401, "Unauthorized");
      }
    } catch (error) {
      return onError(res, 500, "Internal Server Error");
    }
  }

  static async getResetPasswordLink(req, res) {
    try {
      const token = req.query.token;
      const email = req.query.email;
      const user = await User.findOne({ email });
      const verifyToken = jwt.verify(token, user.password);
      if (!user || !verifyToken) {
        return onError(res, 401, "Unauthorized action");
      }

      return res.redirect(
        `http://localhost:3000/reset-password?token=${token}&email=${email}`
      );
    } catch (error) {
      return onError(res, 500, "Internal Server Error");
    }
  }

  static async resetPassword(req, res) {
    try {
      const { email } = req.params;
      const foundUser = await User.findOne({ email });
      const password = await encryptPassword(req.body.password);
      const { email: useremail } = verifyLink(
        req.params.token,
        foundUser.password
      );
      if (!useremail) return onError(res, 401, "Unauthorized Action");
      else {
        foundUser.password = password;
        foundUser.email = useremail;
        await foundUser.save();
        return onSuccess(
          res,
          201,
          "Password Changed Successfully now you can login!"
        );
      }
    } catch (error) {
      return onError(res, 500, "Internal Server Error");
    }
  }
}
module.exports = Users;
