import express from "express";
import mongoose from "mongoose";
import { DB_NAME } from "./constant.js";
import "dotenv/config";
import connectDB from "./db/index.js";

const app = express();
const port = process.env.PORT || 8000;
connectDB()
  .then(() => {
    
    app.listen(port, () => {
      console.log(`😃🫡Server running on port: http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.log("MongoDb connection failed !!", err);
  });

// (async () => {
//   try {
//     await mongoose.connect(`${process.env.DB_URL}/${DB_NAME}`);
//     app.on("error", (err) => console.log(err));

//     app.listen(process.env.PORT, () => {
//       console.log(`server listen on port http://localhost:${process.env.PORT}`);
//     });
//   } catch (error) {
//     console.log("ERROR", error);
//     throw error;
//   }
// })();
