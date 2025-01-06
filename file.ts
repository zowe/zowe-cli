
const { ProfileInfo } = require("@zowe/imperative");
(async () => {
    const profInfo = new ProfileInfo("zowe");
    await profInfo.readProfilesFromDisk();
    const upd = { profileName: "lpar1.zosmf", profileType: "zosmf" };
    await profInfo.updateProperty({ ...upd, property: "user", value: "dddd", setSecure: true });
    await profInfo.updateProperty({ ...upd, property: "password", value: "abc", setSecure: true });
    // await profInfo.updateProperty({ ...upd, property: "user", value: "daaaef", setSecure: true });
})();
