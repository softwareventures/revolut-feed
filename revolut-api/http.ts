
import fs = require("fs");
import jwt = require("jsonwebtoken");
import request = require("request-promise-native");
import {AccessToken} from "./client";


export class HTTPHelper {
    public readonly SUB_DOMAIN: string;
    public readonly API_SUB_DOMAIN: string;
    public readonly API_ROOT: string;
    private readonly localhost: string;
    private readonly CLIENT_ID: string;
    private readonly clientAssertionType: string;

    constructor(clientId: string, dev: boolean) {
        this.CLIENT_ID = clientId;
        if (dev) { // TODO: Document this behaviour in readme to help Dan with testing
            this.API_SUB_DOMAIN = "sandbox-b2b";
            this.SUB_DOMAIN = "sandbox-business";
        } else {
            this.API_SUB_DOMAIN = "b2b";
            this.SUB_DOMAIN = "business";
        }
        this.API_ROOT = `https://${this.API_SUB_DOMAIN}.revolut.com/api/1.0/`;
        this.clientAssertionType = "urn:ietf:params:oauth:client-assertion-type:jwt-bearer";
        this.localhost = "127.0.0.1";
    }

    public getAccessUrl(): string {
        return `https://${this.SUB_DOMAIN}.revolut.com/app-confirm?client_id=${this.CLIENT_ID}&redirect_uri=http://${this.localhost}`;
    }
    public refreshToken(refreshToken: string): request.RequestPromise {
        const endpoint: string = "auth/token";
        const apiUrl: string = this.API_ROOT + endpoint;
        const options = { method: "POST",
            url: apiUrl,
            form: {
                grant_type: "refresh_token",
                refresh_token: refreshToken,
                client_id: this.CLIENT_ID,
                client_assertion_type: this.clientAssertionType,
                client_assertion: this.createSignedJWT()
            },
            json: true
        };
        return request(options);
    }

    public exchangeAccessCode(authCode: string): request.RequestPromise {
        const endpoint: string = "auth/token";
        const apiUrl: string = this.API_ROOT + endpoint;
        const options = { method: "POST",
            url: apiUrl,
            form: {
                grant_type: "authorization_code",
                code: authCode,
                client_id: this.CLIENT_ID,
                client_assertion_type: this.clientAssertionType,
                client_assertion: this.createSignedJWT()
            },
            json: true
        };
        return request(options);
    }
    public getAccounts(token: AccessToken): request.RequestPromise {

        const endpoint: string = "accounts";
        const apiUrl: string = this.API_ROOT + endpoint;
        const options = { method: "GET",
            url: apiUrl,
            headers: {Authorization: `Bearer ${token.access_token}`},
            json: true
        };
        return request(options);
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
            sub: this.CLIENT_ID,
            aud: revolutUrl
        };
        return jwt.sign(payload, privateKey, { algorithm: "RS256", expiresIn: 60 * 60});
    }
}
