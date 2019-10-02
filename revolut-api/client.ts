// Client class to wrap all interactions with the api

import fs = require("fs");
import jwt = require("jsonwebtoken");
import {HTTPHelper} from "./http";

export class Client {
    private readonly clientId: string;
    private readonly dev: boolean;
    private readonly localhost: string;
    private http: HTTPHelper;

    constructor(clientId: string, dev: boolean) {
        this.clientId = clientId;
        this.dev = dev;
        this.localhost = "127.0.0.1";
        this.http = new HTTPHelper(this.clientId, this.dev);
    }

    public authenticate(): string {
        // Just returning the access url for now as a test that all of the new modules work.
        // TODO: Finish this function
        // Check if authenticated, if so, return true.
        // If not, check if we have a refresh token atm, if we do, just use that and hope it works
        // If it doesn't or we don't have it, then get access url and get access code
        // This function should set the token for the object
        const jwt: string = this.createSignedJWT();
        const authCode: string = "THIS_IS_A_DEBUG_PLACEHOLDER";
        this.http.exchangeAccessCode(authCode, this.clientId, jwt);
        return jwt;
    }
    /**
     * Creates a json web token (JWT)
     * returns signed jwt
     */
    private createSignedJWT(): string {
        const privateKeyName = "privatekey.pem"; // Should be valid path to the private key
        const privateKey = fs.readFileSync(privateKeyName);
        const issuer = this.localhost; // Issuer for JWT, should be derived from your redirect URL
        const revolutUrl = "https://revolut.com"; // Constant
        const payload = {
            iss: issuer,
            sub: this.clientId,
            aud: revolutUrl
        };
        return jwt.sign(payload, privateKey, { algorithm: "RS256", expiresIn: 60 * 60});
    }
}

