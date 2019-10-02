
import * as dotenv from "dotenv";
// import open = require("open");
import {Client} from "./revolut-api/client";

// Inits .env file, making it accessible in process.env
dotenv.config();

// Define some constants we are going to use for the script
let CLIENT_ID: string;
if (process.env.CLIENT_ID) {
    CLIENT_ID = process.env.CLIENT_ID;
} else {
    throw new Error("CLIENT_ID environment variable not set, can't continue...");
}

const dev: boolean = !!process.env.NODE_DEV;

const client = new Client(CLIENT_ID, dev);
void client.authenticate();
// void open();
