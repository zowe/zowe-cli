module.exports = {
    branches: [
        {
            name: "master",
            level: "minor"
        },
        {
            name: "zowe-v?-lts",
            level: "patch"
        }
        // {
        //     name: "next",
        //     prerelease: true,
        //     dependencies: { "@zowe/perf-timing": "latest" }
        // }
    ],
    plugins: [
        "@octorelease/changelog",
        ["@octorelease/lerna", {
            aliasTags: {
                // Note: Remove "next" tag here when the "next" branch is uncommented above
                "latest": ["zowe-v2-lts", "next"]
            },
            pruneShrinkwrap: ["@zowe/cli"],
            smokeTest: true,
            versionIndependent: ["@zowe/imperative"]
        }],
        ["@octorelease/github", {
            checkPrLabels: true
        }],
        "@octorelease/git"
    ]
};
