// Client class to wrap all interactions with the api

import {HTTPHelper} from "./http";

export class Client {
    private readonly clientId: string;
    private readonly dev: boolean;
    private http: HTTPHelper;

    constructor(clientId: string, dev: boolean) {
        this.clientId = clientId;
        this.dev = dev;
        this.http = new HTTPHelper(this.clientId, this.dev);
    }

    public authenticate(): string {
        // Just returning the access url for now as a test that all of the new modules work.
        // TODO: Finish this function
        // Check if authenticated, if so, return true.
        // If not, check if we have a refresh token atm, if we do, just use that and hope it works
        // If it doesn't or we don't have it, then get access url and get access code
        // This function should set the token for the object
        return this.http.getAccessUrl("127.0.0.1");
    }
}

