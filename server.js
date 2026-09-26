import "dotenv/config";

import crypto from "node:crypto";
globalThis.crypto = crypto;

import express from "express";
import mongoose from "mongoose";
import multer from "multer";
import path from "path";
import { Worker } from "worker_threads";

import User from "./models/User.js";
import Policy from "./models/Policy.js";
import LOB from "./models/LOB.js";
import Carrier from "./models/Carrier.js";
import Account from "./models/Account.js";


const app = express();

app.use(express.json());


mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
  });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },

  filename: function (req, file, cb) {
    const filename =
      Date.now() + "-" + file.originalname;

    cb(null, filename);
  }

});

const upload = multer({
  storage: storage
});

app.post(
  "/api/upload",
  upload.single("file"),
  (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          message: "Please upload a CSV or XLSX file"
        });
      }
      console.log("File uploaded:", req.file.path);

      const worker = new Worker("./worker.js", {
          workerData: {
            filePath: req.file.path,
            mongoUri: process.env.MONGO_URI
          }
        }
      );
      worker.on("message", (message) => {
        console.log("Worker response:", message);
      });

      worker.on("error", (error) => {
        console.error("Worker error:", error);
      });

      worker.on("exit", (code) => {
        console.log(`Worker stopped with code ${code}`);
      });

      res.status(202).json({message: "File uploaded. Processing started.", file: req.file.filename});

    } catch (error) {
      console.error(error);

      res.status(500).json({
        message: "Upload failed"
      });

    }
  }
);

app.get(
  "/api/policies/search",
  async (req, res) => {

    try {
      const { username } = req.query;
      if (!username) {

        return res.status(400).json({
          message: "username is required"
        });
      }

      const users = await User.find({
        firstName: {
          $regex: username,
          $options: "i"
        }
      });

      if (users.length === 0) {
        return res.json({
          count: 0,
          policies: []
        });
      }

      const userIds = users.map(user => user._id);
      const policies = await Policy.find({
          userId: {
            $in: userIds
          }
        })
        .populate(
          "userId",
          "firstName email phone"
        )
        .populate(
          "lobId",
          "categoryName"
        )
        .populate(
          "carrierId",
          "companyName"
        )
        .populate(
          "accountId",
          "accountName"
        );


      res.json({
        count: policies.length,
        policies
      });

    } catch (error) {
      console.error(error);
      res.status(500).json({
        message: "Search failed"
      });
    }

  }
);

app.get(
  "/api/policies/aggregate",
  async (req, res) => {
    try {
      const result = await Policy.aggregate([
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "user"
          }
        },
        {
          $unwind: "$user"
        },
        {
          $group: {
            _id: "$user._id",
            firstName: {
              $first: "$user.firstName"
            },
            email: {
              $first: "$user.email"
            },
            totalPolicies: {
              $sum: 1
            },
            policies: {
              $push: {

                policyNumber:
                  "$policyNumber",

                policyStartDate:
                  "$policyStartDate",

                policyEndDate:
                  "$policyEndDate",

                lobId:
                  "$lobId",

                carrierId:
                  "$carrierId"

              }
            }
          }
        },
        {
          $project: {
            _id: 0,
            userId: "$_id",
            firstName: 1,
            email: 1,
            totalPolicies: 1,
            policies: 1
          }
        }
      ]);

      res.json(result);
    } catch (error) {
      console.error(error);
      res.status(500).json({
        message: "Aggregation failed"
      });
    }
  }
);

app.get("/health", (req, res) => {
  res.json({
    status: "OK"
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});