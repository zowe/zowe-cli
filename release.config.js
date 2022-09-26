module.exports = {
    branches: [
        {
            name: "master",
            level: "minor",
            dependencies: ["@zowe/perf-timing", "@zowe/imperative"]
        },
        {
            name: "zowe-v?-lts",
            level: "patch",
            dependencies: ["@zowe/perf-timing", "@zowe/imperative"]
        }
        // {
        //     name: "next",
        //     prerelease: true,
        //     dependencies: { "@zowe/perf-timing": "latest", "@zowe/imperative: "next" }
        // }
    ],
    plugins: [
        "@octorelease/changelog",
        ["@octorelease/lerna", {
            aliasTags: {
                "latest": ["zowe-v2-lts", "next"]
            },
            pruneShrinkwrap: ["@zowe/cli"],
            smokeTest: true
        }],
        ["@octorelease/github", {
            checkPrLabels: true
        }],
        "@octorelease/git"
    ]
};
