const { ProfileCredentials, ProfileInfo } = require("@zowe/imperative");

(async () => {
  const homeDir = "/Users/jr897694/Desktop/test";
  process.env["ZOWE_CLI_HOME"] = homeDir;

  const requireKeytar = () => require("@zowe/secrets-for-zowe-sdk").keyring;
  const profInfo = new ProfileInfo("zowe", {
    overrideWithEnv: true,
    credMgrOverride: ProfileCredentials.defaultCredMgrWithKeytar(requireKeytar),
    checkLevelLayers: true
  });
  console.log("returned profInfo ", profInfo);
  await profInfo.readProfilesFromDisk({ homeDir, projectDir: false });
  const zosmfProfNames = profInfo.getAllProfiles("zosmf");
  const baseProfNames = profInfo.getAllProfiles("base");
  console.log("ZMF profiles ", zosmfProfNames);
  console.log("profLoc expands to ", zosmfProfNames[0].profLoc);
  console.log("BASE profiles ", baseProfNames);
  console.log("profLoc expands to ", baseProfNames[0].profLoc);
  for (const element of zosmfProfNames) {
    console.log("return from mergeArgsForProfile ", profInfo.mergeArgsForProfile(element, { getSecureVals: true }));
  }
})().catch((err) => {
  console.error(err);
  process.exit(1);
});