const { ProfileInfo } = require("@zowe/imperative");
(async () => {
    const profInfo = new ProfileInfo("zowe");
    await profInfo.readProfilesFromDisk();
    const upd = { profileName: "lpar1.test", profileType: "zosmf" };
    await profInfo.updateProperty({ ...upd, property: "user", value: "abc", setSecure: false });
    await profInfo.updateProperty({ ...upd, property: "password", value: "aa", setSecure: false });
})();