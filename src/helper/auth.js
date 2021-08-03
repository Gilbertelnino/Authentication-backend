/* eslint-disable linebreak-style */
const { config } = require("dotenv");
const { verify } = require("jsonwebtoken");
const { genSalt, hash } = require("bcryptjs");

config();
const { ACCESS_TOKEN_SECRET } = process.env;

const encryptPassword = async (password) => {
  const salt = await genSalt(12);
  const hashed = await hash(password, salt);
  return hashed;
};

const verifyLink = (token, secret = ACCESS_TOKEN_SECRET) => {
  try {
    const data = verify(token, secret);
    return data;
  } catch (error) {
    return error;
  }
};

module.exports = { encryptPassword, verifyLink };
