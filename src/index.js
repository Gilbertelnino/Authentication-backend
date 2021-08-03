const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const { connectDB } = require("./database/config/db");
const userRoute = require("./routes/user");
const app = express();

dotenv.config();
connectDB();

app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 3005;
app.use("/users", userRoute);

app.get("/", (req, res) => {
  res.status(200).json({
    message: "endpoint working",
  });
});

app.listen(PORT, () => console.log(`App is listening on port ${PORT}`));
