import {readFile, writeFile} from "fs-extra";
import {AccessToken} from "./revolut-api/types";

/**
 * Reads access token from disk. Returns null if the token could not be loaded.
 */
export function readAccessToken(filename: string): Promise<AccessToken | null> {
    return readFile(filename, "utf-8")
        .then(token => JSON.parse(token))
        .catch(() => null);
}

/**
 * Writes access token to disk.
 */
export function writeAccessToken(filename: string, token: AccessToken): Promise<void> {
    return writeFile(filename, JSON.stringify(token), "utf-8");
}