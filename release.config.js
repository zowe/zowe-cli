module.exports = {
    branches: [
        {
            // This is a temporary change, in case we need to release a critical fix to the V2-lts line.
            name: "zowe-v?-lts",
            level: "patch"
        },
        {
            name: "master",
            level: "none"
        }
        // {
        //     name: "next",
        //     prerelease: true,
        //     dependencies: { "@zowe/perf-timing": "latest" }
        // }
    ],
    plugins: [
        ["@octorelease/changelog", {
            "displayNames": {
                "cli": "Zowe CLI",
                "core": "Core SDK",
                "imperative": "Imperative",
                "zosconsole": "z/OS Console SDK",
                "zosfiles": "z/OS Files SDK",
                "zosjobs": "z/OS Jobs SDK",
                "zoslogs": "z/OS Logs SDK",
                "provisioning": "Provisioning SDK",
                "secrets": "Secrets SDK",
                "zostso": "z/OS TSO SDK",
                "zosuss": "z/OS USS SDK",
                "workflows": "Workflows SDK",
                "zosmf": "z/OSMF SDK",
                "cli-test-utils": "CLI Test Utils"
            }
        }],
        ["@octorelease/lerna", {
            aliasTags: {
                "latest": ["zowe-v2-lts"]
            },
            pruneShrinkwrap: ["@zowe/cli"],
            smokeTest: true,
            versionIndependent: ["@zowe/imperative"]
        }],
        ["@octorelease/github", {
            checkPrLabels: true,
            publishRelease: true
        }],
        "@octorelease/git"
    ]
};
