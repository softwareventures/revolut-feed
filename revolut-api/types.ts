
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

/**
 * Object of counterparties account data from the api
 */
export interface CounterpartyAccount {
    id: string;
    currency: string;
    type: string;
    account_no: string;
    sort_code: string;
    email: string;
    name: string;
    bank_country: string;
    recipient_charges: string;
}

/**
 * Object representing counterparties
 */
export interface Counterparty {
    id: string;
    name: string;
    phone: string;
    profile_type: string;
    country: string;
    state: string;
    created_at: string;
    updated_at: string;
    accounts: CounterpartyAccount[];
}

/**
 * Object representing a counterparty from a transaction
 */
export interface TransactionCounterparty {
    id: string;
    type: string;
    account_id: string;
}

/**
 * Object representing a leg from a transaction
 */
export interface Leg {
    leg_id: string;
    account_id: string;
    counterparty: TransactionCounterparty;
    amount: number;
    currency: string;
    description: string;
    balance: number;
}

/**
 * Object representing a transaction
 */
export interface Transaction {
    id: string;
    type: string;
    request_id: string;
    state: string;
    created_at: string;
    updated_at: string;
    completed_at: string;
    reference: string;
    legs: Leg[];
    scheduled_for: string;
}