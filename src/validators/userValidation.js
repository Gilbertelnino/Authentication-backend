const Joi = require("joi");

// validation schema

const loginValidation = (data) => {
  const schema = Joi.object({
    email: Joi.string().min(3).required().email(),
    password: Joi.string().min(6).required(),
  });
  return schema.validate(data);
};
const signupValidation = (data) => {
  const schema = Joi.object({
    firstname: Joi.string().min(3).required(),
    lastname: Joi.string().min(3).required(),
    email: Joi.string().min(3).required().email(),
    password: Joi.string().min(6).required(),
  });
  return schema.validate(data);
};
module.exports = { loginValidation, signupValidation };
