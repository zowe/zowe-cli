/**
 * Represents the content of the JSON file into which the Zowe Daemon
 * stores the process ID for a given user.
 */
export interface IDaemonPidForUser {
    user: string;
    pid: number;
}
