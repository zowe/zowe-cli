import { ProfileInfo } from "@zowe/imperative";

(async () => {
    // Load connection info from default z/OSMF profile
    const profInfo = new ProfileInfo("zowe");
    await profInfo.readProfilesFromDisk();
    const sshProfAttrs = profInfo.getDefaultProfile("ssh");
    console.log(sshProfAttrs);
    const name = profInfo.getTeamConfig().api.profiles.getProfileNameFromPath(sshProfAttrs?.profLoc.jsonLoc!)
    profInfo.getTeamConfig().move(name,"empty_profile."+name);
    profInfo.getTeamConfig().save()
    const sshProfAttrs1 = profInfo.getDefaultProfile("ssh");
    console.log(sshProfAttrs1);
})().catch((err) => {
    console.error(err);
    process.exit(1);
});