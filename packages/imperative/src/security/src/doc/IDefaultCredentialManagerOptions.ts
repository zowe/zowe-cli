import type { ICredentialManagerOptions } from "./ICredentialManagerOptions";

export enum PersistenceLevel {
    SessionOnly = "session",
    LocalMachine = "local_machine",
    Enterprise = "enterprise"
};

export enum PersistenceValue {
    SessionOnly = 1,
    LocalMachine = 2,
    Enterprise = 3
};

export interface IDefaultCredentialManagerOptions extends ICredentialManagerOptions {
    persist?: PersistenceLevel;
}