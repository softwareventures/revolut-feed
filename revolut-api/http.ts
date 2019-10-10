import request = require("request-promise-native");
import {AccessToken} from "./client";


export class HTTPHelper {
    public readonly SUB_DOMAIN: string;
    public readonly API_SUB_DOMAIN: string;
    public readonly API_ROOT: string;
    private readonly CLIENT_ID: string;

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
    }

    public getAccessUrl(localHost: string): string {
        return `https://${this.SUB_DOMAIN}.revolut.com/app-confirm?client_id=${this.CLIENT_ID}&redirect_uri=http://${localHost}`;
    }

    public exchangeAccessCode(authCode: string, clientId: string, jwt: string): request.RequestPromise {
        const endpoint: string = "auth/token";
        const apiUrl: string = this.API_ROOT + endpoint;
        const options = { method: "POST",
            url: apiUrl,
            form: {
                grant_type: "authorization_code",
                code: authCode,
                client_id: clientId,
                client_assertion_type: "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
                client_assertion: jwt
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
}
