
export interface Account {
    id: string;
    name: string;
    balance: number;
    currency: string;
    state: string;
    public: boolean;
    updated_at: Date;
    created_at: Date;
}