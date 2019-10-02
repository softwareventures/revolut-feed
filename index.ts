
import * as dotenv from "dotenv";
import fs = require("fs");
import jwt = require("jsonwebtoken");
import open = require("open");
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

const LOCALHOST = "127.0.0.1";
const dev: boolean = !!process.env.NODE_DEV;


/**
 * Creates a json web token (JWT)
 * returns signed jwt
 */
function createSignedJWT(): string {
    const privateKeyName = "privatekey.pem"; // Should be valid path to the private key
    const privateKey = fs.readFileSync(privateKeyName);
    const issuer = LOCALHOST; // Issuer for JWT, should be derived from your redirect URL
    const revolutUrl = "https://revolut.com"; // Constant
    const payload = {
        iss: issuer,
        sub: CLIENT_ID,
        aud: revolutUrl
    };
    return jwt.sign(payload, privateKey, { algorithm: "RS256", expiresIn: 60 * 60});
}

const client = new Client(CLIENT_ID, dev);
void open(client.authenticate());
console.log(createSignedJWT());
