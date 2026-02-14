import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface DeleteAllSubscribersResult {
    subscribersDeleted: bigint;
}
export type Time = bigint;
export interface SubscriberLoginInput {
    subscriberId?: bigint;
    name: string;
    phone: string;
}
export interface CallerPaymentDue {
    month: bigint;
    year: bigint;
    amountCents: bigint;
}
export interface BulkImportResult {
    result?: Subscriber;
    name: string;
    error?: string;
}
export interface Package {
    id: bigint;
    name: string;
    priceUsd: bigint;
}
export interface SubscriberMonthlyBill {
    fullName: string;
    amountDue: bigint;
}
export interface SubscriberLoginResult {
    result?: Subscriber;
    claimedPhone?: string;
    error?: string;
}
export interface BulkImportInput {
    names: string;
    subscriptionStartDate: Time;
    packageId: bigint;
}
export interface SubscriberResult {
    result?: Subscriber;
    error?: string;
}
export interface Subscriber {
    id: bigint;
    active: boolean;
    fullName: string;
    subscriptionStartDate: Time;
    phone: string;
    packageId: bigint;
}
export interface MonthlyBillsResult {
    month: bigint;
    year: bigint;
    subscribers: Array<SubscriberMonthlyBill>;
}
export interface UserProfile {
    name: string;
    phone: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    bulkCreateSubscribers(input: BulkImportInput): Promise<Array<BulkImportResult>>;
    createPackage(name: string, priceUsd: bigint): Promise<Package>;
    createSubscriber(fullName: string, phone: string, packageId: bigint, subscriptionStartDate: Time): Promise<SubscriberResult>;
    deleteAllSubscribers(): Promise<DeleteAllSubscribersResult>;
    fetchMonthlyBills(year: bigint, month: bigint): Promise<MonthlyBillsResult>;
    getAllPackages(): Promise<Array<Package>>;
    getCallerMonthlyDue(year: bigint, month: bigint): Promise<CallerPaymentDue>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getPackage(id: bigint): Promise<Package>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    isPhoneNumberTaken(phone: string): Promise<boolean>;
    loginClaimSubscriber(loginInput: SubscriberLoginInput): Promise<SubscriberLoginResult>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    updatePackage(id: bigint, name: string, priceUsd: bigint): Promise<Package>;
}
