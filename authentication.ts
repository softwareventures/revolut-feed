import {readFile, writeFile} from "fs-extra";
import * as readline from "readline";
import {AccessToken} from "./revolut-api/types";

/**
 * Reads access token from disk. Returns null if the token could not be loaded.
 */
export async function readAccessToken(filename: string): Promise<AccessToken | null> {
    return readFile(filename, "utf-8")
        .then(token => JSON.parse(token))
        .catch(() => null);
}

/**
 * Writes access token to disk.
 */
export async function writeAccessToken(filename: string, token: AccessToken): Promise<void> {
    return writeFile(filename, JSON.stringify(token), "utf-8");
}

/**
 * Reads auth code from terminal input.
 * @return - the user input as a string promise.
 */
export async function readAuthCode(): Promise<string> {
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