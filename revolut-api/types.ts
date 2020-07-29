/**
 * @file Exports all interfaces used by this module
 */

/**
 * Basic object definition for get requests' options using the request lib
 */
export interface Options {
    readonly headers: { readonly Authorization: string };
    readonly method: "GET";
    readonly json: true;
    readonly url: string;
}

/**
 * Object representing the JSON data received when getting an access token via access code
 */
export interface AccessToken {
    readonly access_token: string;
    readonly token_type: string;
    readonly expires_in: number;
    readonly refresh_token: string;
}

// /**
//  * Object representing the JSON data received when refreshing the current access token
//  */
// export interface RefreshToken {
//     readonly access_token: string;
//     readonly token_type: string;
//     readonly expires_in: number;
// }

/**
 * Object representing a revolut account
 */
export interface Account {
    readonly id: string;
    readonly name: string;
    readonly balance: number;
    readonly currency: string;
    readonly state: string;
    readonly public: boolean;
    readonly updated_at: string;
    readonly created_at: string;
}

/**
 * Object of counterparties account data from the api
 */
export interface CounterpartyAccount {
    readonly id: string;
    readonly currency: string;
    readonly type: string;
    readonly account_no: string;
    readonly sort_code: string;
    readonly email: string;
    readonly name: string;
    readonly bank_country: string;
    readonly recipient_charges: string;
}

/**
 * Object representing counterparties
 */
export interface Counterparty {
    readonly id: string;
    readonly name: string;
    readonly phone: string;
    readonly profile_type: string;
    readonly country: string;
    readonly state: string;
    readonly created_at: string;
    readonly updated_at: string;
    readonly accounts: ReadonlyArray<CounterpartyAccount>;
}

/**
 * Object representing a counterparty from a transaction
 */
export interface TransactionCounterparty {
    readonly id: string;
    readonly type: string;
    readonly account_id: string;
}

/**
 * Object representing a leg from a transaction
 */
export interface Leg {
    readonly leg_id: string;
    readonly account_id: string;
    readonly counterparty: TransactionCounterparty;
    readonly amount: number;
    readonly currency: string;
    readonly description: string;
    readonly balance: number;
}

/**
 * Object representing a transaction
 */
export interface Transaction {
    readonly id: string;
    readonly type: string;
    readonly request_id: string;
    readonly state: string;
    readonly created_at: string;
    readonly updated_at: string;
    readonly completed_at: string;
    readonly reference?: string;
    readonly legs: ReadonlyArray<Leg>;
    readonly scheduled_for: string;
}