import { ProfileInfo } from "@zowe/imperative";
import { GetJobs } from "@zowe/zos-jobs-for-zowe-sdk";
(async () => {
    // Load connection info from default z/OSMF profile
    const profInfo = new ProfileInfo("zowe");
    await profInfo.readProfilesFromDisk();
    const zosmfProfAttrs = profInfo.getDefaultProfile("zosmf");
    const zosmfMergedArgs = profInfo.mergeArgsForProfile(zosmfProfAttrs!, { getSecureVals: true });
    const session = ProfileInfo.createSession(zosmfMergedArgs.knownArgs);
    const owner: string | undefined = session.ISession.user;
    // This may take awhile...
    const response = await GetJobs.getJobsByOwner(session, owner!);
    console.log(response);
})().catch((err) => {
    console.error(err);
    process.exit(1);
});