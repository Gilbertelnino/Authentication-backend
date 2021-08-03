/* eslint-disable linebreak-style */
const jwt = require("jsonwebtoken");
const client = require("../helper/redis_config");

const signAccessToken = (userInfo) => {
  try {
    const payload = {
      id: userInfo._id,
      fullName: `${userInfo.firstname} ${userInfo.lastname}`,
    };
    const token = jwt.sign({ payload }, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: "10m",
    });
    client.set(`accessToken-${payload.id.toString()}`, token.toString());
    return token;
  } catch (error) {
    return error;
  }
};
const signNewAccessToken = (userInfo) => {
  try {
    const payload = {
      id: userInfo.id,
      fullName: `${userInfo.firstname} ${userInfo.lastname}`,
    };
    const token = jwt.sign({ payload }, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: "10m",
    });
    client.set(`accessToken-${payload.id.toString()}`, token.toString());
    return token;
  } catch (error) {
    return error;
  }
};
const signRefreshToken = (userInfo) => {
  try {
    const payload = {
      id: userInfo._id,
      fullName: `${userInfo.firstname} ${userInfo.lastname}`,
    };
    const token = jwt.sign({ payload }, process.env.REFRESH_TOKEN, {
      expiresIn: "1y",
    });
    client.set(`refreshToken-${payload.id.toString()}`, token.toString());
    return token;
  } catch (error) {
    return error;
  }
};

module.exports = { signAccessToken, signRefreshToken, signNewAccessToken };
