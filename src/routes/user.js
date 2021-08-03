const express = require("express");
const router = express.Router();
const {
  verifyAccessToken,
  isNotVerified,
} = require("../middlewares/verifyToken");
const Users = require("../controllers/user");
const Validator = require("../middlewares/validator");
const UserExists = require("../middlewares/userExists");

router.get("/", Users.getUsers);

router.post(
  "/signup",
  Validator.signup,
  UserExists.registerExists,
  Users.registerUser
);
router.post(
  "/login",
  Validator.login,
  UserExists.loginExists,
  isNotVerified,
  Users.loginUser
);
router.delete("/logout", verifyAccessToken, Users.logout);
router.get("/verify/signup", Users.verifyUser);
router.delete("/:id", verifyAccessToken, Users.deleteUser);
router.post("/forgetPassword", Users.forgetPassword);
router.get("/resetPassword", Users.getResetPasswordLink);
router.put("/resetPassword/:token/:email", Users.resetPassword);
router.get("/renewToken/:id", Users.renewAccessToken);
module.exports = router;
