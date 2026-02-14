import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Subscriber {
    id: bigint;
    active: boolean;
    fullName: string;
    subscriptionStartDate: Time;
    phone: string;
    packageId: bigint;
}
export type Time = bigint;
export interface Package {
    id: bigint;
    name: string;
    priceUsd: bigint;
}
export interface UserProfile {
    name: string;
    phone: string;
}
export interface BillingEntryView {
    year: bigint;
    months: Array<{
        due: boolean;
        month: bigint;
        paid: boolean;
    }>;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createPackage(name: string, priceUsd: bigint): Promise<Package>;
    createSubscriber(fullName: string, phone: string, packageId: bigint, subscriptionStartDate: Time): Promise<Subscriber>;
    getAllActiveSubscribers(): Promise<Array<Subscriber>>;
    getAllPackages(): Promise<Array<Package>>;
    getBillingState(phone: string): Promise<Array<BillingEntryView>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getPackage(id: bigint): Promise<Package>;
    getSubscriber(phone: string): Promise<Subscriber>;
    getSubscriberBillingSummary(phone: string): Promise<{
        totalOutstanding: bigint;
        totalPaid: bigint;
        totalDue: bigint;
    }>;
    getTotalDueForMonth(year: bigint, month: bigint): Promise<bigint>;
    getTotalDueForYear(year: bigint): Promise<bigint>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    setMonthBillingStatus(phone: string, year: bigint, month: bigint, due: boolean, paid: boolean): Promise<void>;
    updatePackage(id: bigint, name: string, priceUsd: bigint): Promise<Package>;
    updateSubscriber(phone: string, fullName: string, packageId: bigint, active: boolean): Promise<Subscriber>;
}
