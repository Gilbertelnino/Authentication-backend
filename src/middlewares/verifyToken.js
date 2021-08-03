const jwt = require("jsonwebtoken");
const User = require("../database/models/User");
const { onError } = require("../utils/response");
const client = require("../helper/redis_config");

const verifyAccessToken = async (req, res, next) => {
  const token = req.header("auth-token");
  if (!token) return onError(res, 403, "Not Allowed");
  await jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (error, decod) => {
    if (error) {
      return onError(res, 403, "Token is incorrect or expired!");
    }

    client.get(`accessToken-${decod.payload.id}`, (err, val) => {
      if (decod.payload) {
        if (val) {
          req.user = decod.payload;
          return next();
        }
        return onError(
          res,
          401,
          "User already logged out, Please Login and try again!"
        );
      }
    });
  });
};
// generate token function
const generateToken = (userinfo) => {
  try {
    const payload = {
      firstname: userinfo.firstname,
      lastname: userinfo.lastname,
      email: userinfo.email,
      password: userinfo.password,
    };
    const token = jwt.sign({ payload: payload }, process.env.TOKEN_SECRET_KEY, {
      expiresIn: "1h",
    });
    return token;
  } catch (error) {
    return error;
  }
};

// Check if user is verified or not function

const isNotVerified = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return onError(
        res,
        400,
        "User doesn't exist! If you have been registered, Please check you email to verify your account!"
      );
    } else if (user.isVerified) {
      return next();
    } else {
      return onError(
        res,
        400,
        "Your account has not been verified,Please check your email to Verify you email to continue!"
      );
    }
  } catch (error) {
    return onError(res, 500, "Internal server error");
  }
};

module.exports = { verifyAccessToken, isNotVerified, generateToken };
