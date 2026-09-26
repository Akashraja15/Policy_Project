import { workerData, parentPort } from "worker_threads";
import mongoose from "mongoose";
import XLSX from "xlsx";

import Agent from "./models/Agent.js";
import User from "./models/User.js";
import Account from "./models/Account.js";
import LOB from "./models/LOB.js";
import Carrier from "./models/Carrier.js";
import Policy from "./models/Policy.js";

import crypto from "node:crypto";

globalThis.crypto = crypto;

const { filePath, mongoUri } = workerData;

async function processFile() {
  try {
    await mongoose.connect(mongoUri);
    console.log("Worker connected to MongoDB");

    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet);

    console.log(`Total rows: ${rows.length}`);

    let count = 0;
    for (const row of rows) {
      let agent = await Agent.findOne({
        agentName: row.agent
      });

      if (!agent) {
        agent = await Agent.create({
          agentName: row.agent
        });
      }

      let user = await User.findOne({
        email: row.email
      });

      if (!user) {
        user = await User.create({
          firstName: row.firstname,
          dob: row.dob,
          address: row.address,
          phone: row.phone,
          state: row.state,
          zip: row.zip,
          email: row.email,
          gender: row.gender,
          userType: row.userType,
          agentId: agent._id
        });
      }

      let account = await Account.findOne({
        accountName: row.account_name,
        userId: user._id
      });

      if (!account) {
        account = await Account.create({
          accountName: row.account_name,
          userId: user._id
        });
      }

      let lob = await LOB.findOne({
        categoryName: row.category_name
      });

      if (!lob) {
        lob = await LOB.create({
          categoryName: row.category_name
        });
      }

      let carrier = await Carrier.findOne({
        companyName: row.company_name
      });

      if (!carrier) {
        carrier = await Carrier.create({
          companyName: row.company_name
        });
      }

      const existingPolicy = await Policy.findOne({
        policyNumber: row.policy_number
      });

      if (!existingPolicy) {

        await Policy.create({
          policyNumber: row.policy_number,
          policyStartDate: row.policy_start_date,
          policyEndDate: row.policy_end_date,
          userId: user._id,
          accountId: account._id,
          lobId: lob._id,
          carrierId: carrier._id
        });
      }
      count++;

      if (count % 100 === 0) {
        console.log(`Processed ${count} records`);
      }
    }

    parentPort.postMessage({
      success: true,
      message: "File processed successfully",
      totalRecords: rows.length
    });

  } catch (error) {
    console.error("Worker error:", error);

    parentPort.postMessage({
      success: false,
      message: error.message
    });

  } finally {
    await mongoose.connection.close();
  }
}

processFile();