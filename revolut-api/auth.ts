// Functions relating to the authentication flow

// import {HTTPHelper} from "./http";

// This module needs to make a class called AuthHelper
// It also needs exceptions we can throw when not authenticated so we can expect this in the script

export interface AuthResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
    refresh_token: string;
}