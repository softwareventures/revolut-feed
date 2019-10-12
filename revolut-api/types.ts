
/**
 * Basic object definition for get requests' options using the request lib
 */
export interface Options {
    headers: { Authorization: string };
    method: "GET";
    json: true;
    url: string;
}

/**
 * Object representing the JSON data received when getting an access token via access code
 */
export interface AccessToken {
    access_token: string;
    token_type: string;
    expires_in: number;
    refresh_token: string;
}

/**
 * Object representing the JSON data received when refreshing the current access token
 */
export interface RefreshToken {
    access_token: string;
    token_type: string;
    expires_in: number;
}

/**
 * Object representing a revolut account
 */
export interface Account {
    id: string;
    name: string;
    balance: number;
    currency: string;
    state: string;
    public: boolean;
    updated_at: string;
    created_at: string;
}