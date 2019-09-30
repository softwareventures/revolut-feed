
import * as dotenv from "dotenv";
import fs = require("fs");
import jwt = require("jsonwebtoken");
import open = require("open");

// Inits .env file, making it accessible in process.env
dotenv.config();

// Define some constants we are going to use for the script
const CLIENT_ID = process.env.CLIENT_ID;
const LOCALHOST = "127.0.0.1";

let SUB_DOMAIN: string;
let API_SUB_DOMAIN: string;

if (process.env.NODE_DEV) { // TODO: Document this behaviour in readme to help Dan with testing
    API_SUB_DOMAIN = "sandbox-b2b";
    SUB_DOMAIN = "sandbox-business";
} else {
    API_SUB_DOMAIN = "b2b";
    SUB_DOMAIN = "business";
}

const PERMIT_ACCESS_URL = `https://${SUB_DOMAIN}.revolut.com/app-confirm?client_id=${CLIENT_ID}&redirect_uri=http://${LOCALHOST}`;
const API_ROOT = `https://${API_SUB_DOMAIN}.revolut.com/api/1.0/`;


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


void open(PERMIT_ACCESS_URL);
console.log(API_ROOT);
console.log(createSignedJWT());
