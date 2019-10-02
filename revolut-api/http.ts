import request = require("request");


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

    public exchangeAccessCode(authCode: string, clientId: string, jwt: string): void {
        // FIXME: The request stuff is broken. Can't get the client to auth in postman either. Need to come back to this
        const endpoint: string = "auth/token";
        const apiUrl: string = this.API_ROOT + endpoint;
        console.log(apiUrl);
        const options = {
            method: "POST",
            url: apiUrl,
            form: {
                grant_type: "authorization_code",
                code: authCode,
                client_id: clientId,
                client_assertion_type: "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
                client_assertion: jwt
            },
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            }
        };
        request(options, function optionalCallback(err, httpResponse, body): JSON | void {
            if (err || httpResponse.statusCode !== 200) {
                return console.error("upload failed with", httpResponse.statusCode, ":", err, body);
            }
            console.log("Upload successful!  Server responded with:", body);
        });
    }
}
