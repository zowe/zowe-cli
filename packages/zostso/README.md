# z/OS TSO Package

Contains APIs to interact with TSO on z/OS (using z/OSMF TSO REST endpoints).

## API Examples

**Issue the TSO command "status" to display info about jobs for your user ID**

```typescript
import { ProfileInfo } from "@zowe/imperative";
import { IssueTso } from "@zowe/zos-tso-for-zowe-sdk";

(async () => {
    // Load connection info from default z/OSMF profile
    const profInfo = new ProfileInfo("zowe");
    await profInfo.readProfilesFromDisk();
    const zosmfProfAttrs = profInfo.getDefaultProfile("zosmf");
    const zosmfMergedArgs = profInfo.mergeArgsForProfile(zosmfProfAttrs, { getSecureVals: true });
    const session = ProfileInfo.createSession(zosmfMergedArgs.knownArgs);

    // Load account number from default TSO profile (optional)
    const tsoProfAttrs = profInfo.getDefaultProfile("tso");
    const tsoMergedArgs = profInfo.mergeArgsForProfile(tsoProfAttrs);
    const accountNumberFromProfile = tsoMergedArgs.knownArgs.find(
        arg => arg.argName === "account").argValue as string;

    const accountNumber = accountNumberFromProfile || "ACCT#";
    const command = "status";
    const response = await IssueTso.issueTsoCommand(session, accountNumber, command);
    if (response.success) {
        console.log(response);
    } else {
        throw new Error(`Failed to issue TSO command "${command}"`);
    }
})().catch((err) => {
    console.error(err);
    process.exit(1);
});
```

#
**Demonstrate starting, pinging, and stopping a TSO address space**

```typescript
import { ProfileInfo } from "@zowe/imperative";
import { PingTso, StartTso, StopTso } from "@zowe/zos-tso-for-zowe-sdk";

(async () => {
    // Load connection info from default z/OSMF profile
    const profInfo = new ProfileInfo("zowe");
    await profInfo.readProfilesFromDisk();
    const zosmfProfAttrs = profInfo.getDefaultProfile("zosmf");
    const zosmfMergedArgs = profInfo.mergeArgsForProfile(zosmfProfAttrs, { getSecureVals: true });
    const session = ProfileInfo.createSession(zosmfMergedArgs.knownArgs);

    const accountNumber = "ACCT#";
    const startResponse = await StartTso.start(session, accountNumber, {
        codePage: "285"
    });

    const servletKey = startResponse.servletKey;
    if (startResponse.success) {
        console.log(`[${servletKey}] Started`);
    } else {
        throw new Error("Failed to start TSO address space");
    }

    const pingResponse = await PingTso.ping(session, servletKey);
    if (pingResponse.success) {
        console.log(`[${servletKey}] Ping succeeded`);
    } else {
        throw new Error("Failed to ping TSO address space");
    }

    const stopResponse = await StopTso.stop(session, servletKey);
    if (stopResponse.success) {
        console.log(`[${servletKey}] Stopped`);
    } else {
        throw new Error("Failed to stop TSO address space");
    }

    try {
        await PingTso.ping(session, servletKey);
    } catch {
        console.log(`[${servletKey}] Ping failed`);
    }
})().catch((err) => {
    console.error(err);
    process.exit(1);
});
```
