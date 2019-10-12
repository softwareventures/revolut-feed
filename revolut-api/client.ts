// Client class to wrap all interactions with the api

import fs = require("fs");
import readline = require("readline");
import {HTTPHelper} from "./http";
import {AccessToken, Account, RefreshToken} from "./types";


// TODO: Figuring out we need to reauth
// TODO: Create file to manage io

function getAccessCode(): Promise<string> {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    return new Promise(resolve => {
        rl.question("Enter Access Code: ", (accessCode) => {
            rl.close();
            resolve(accessCode);
        });
    });
}

export class Client {
    private readonly filename: string;
    private readonly clientId: string;
    private readonly dev: boolean;
    private http: HTTPHelper;
    private authenicated: boolean;
    private token: AccessToken;

    constructor(clientId: string, dev: boolean) {
        this.clientId = clientId;
        this.dev = dev;
        this.http = new HTTPHelper(this.clientId, this.dev);
        this.authenicated = false;
        this.filename = "./access_token.json";
        this.token = this.readToken() as AccessToken;
    }
    public async authenticate(): Promise<boolean> {
        const token: AccessToken | false = this.readToken();
        if (!token) {
            const authCode = await getAccessCode();
            const response = await this.http.exchangeAccessCode(String(authCode));
            this.setToken(response);
            this.authenicated = true;
            return true;
        } else {
            await this.refreshToken();
            this.authenicated = true;
            return true;
        }
    }
    public async getAccounts(): Promise<Account[]> {
        if (!this.authenicated) {
            throw new Error("Not Authenticated");
        }
        console.log(this.token);
        return await this.http.getAccounts(this.token);
    }
    private readToken(): AccessToken | false {
        try {
            const rawData = fs.readFileSync(this.filename, "utf-8");
            const data = JSON.parse(rawData);
            return data as AccessToken;
        } catch (err) {
            return false;
        }
    }
    private setToken(token: AccessToken): void {
        fs.writeFileSync(this.filename, JSON.stringify(token));
    }
    private async refreshToken(): Promise<void> {
        return this.getRefreshToken().then(refreshToken => {
            console.log(refreshToken);
            this.token.access_token = refreshToken.access_token;
            this.setToken(this.token);
        });
    }
    private getRefreshToken(): Promise<RefreshToken> {
        return this.http.refreshToken(this.token.refresh_token);
    }
}
