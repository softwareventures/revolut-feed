// Client class to wrap all interactions with the api

import fs = require("fs");
import jwt = require("jsonwebtoken");
import readline = require("readline");
import {Account} from "./account";
import {HTTPHelper} from "./http";


const FILENAME = "./access_token.json";


export interface AccessToken {
    access_token: string;
    token_type: string;
    expires_in: number;
    refresh_token: string;
}
// TODO: Token refresh
// TODO: Figuring out we need to reauth

function readToken(): AccessToken | false {
    try {
        const rawData = fs.readFileSync(FILENAME, "utf-8");
        const data = JSON.parse(rawData);
        return data as AccessToken;
    } catch (err) {
        return false;
    }
}

function setToken(token: AccessToken): void {
    fs.writeFileSync(FILENAME, JSON.stringify(token));
}

function getAccessCode(): Promise<string> {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    // TODO: Figure out why the below prints when it isn't called
    return new Promise(resolve => {
        rl.question("Enter Access Code: ", (accessCode) => {
            rl.close();
            resolve(accessCode);
        });
    });
}


export class Client {
    private authenicated: boolean;
    private readonly clientId: string;
    private readonly dev: boolean;
    private readonly localhost: string;
    private http: HTTPHelper;

    constructor(clientId: string, dev: boolean) {
        this.clientId = clientId;
        this.dev = dev;
        this.localhost = "127.0.0.1";
        this.http = new HTTPHelper(this.clientId, this.dev);
        this.authenicated = false;
    }
    public async authenticate(): Promise<boolean> {
        const token: AccessToken | false = readToken();
        if (!token) {
            const jwt: string = this.createSignedJWT();
            const authCode = await getAccessCode();
            const response = await this.http.exchangeAccessCode(String(authCode), this.clientId, jwt);
            setToken(response);
            this.authenicated = true;
            return true;
        } else {
            this.authenicated = true;
            return true;
        }
    }
    public async get_accounts(): Promise<Account[]> {
        const token: AccessToken | false = readToken();
        if (!this.authenicated) {
            throw new Error("Not Authenticated");
        }
        return await this.http.getAccounts(token as AccessToken);
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

