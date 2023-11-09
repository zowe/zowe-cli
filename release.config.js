module.exports = {
    branches: [
        {
            name: "master",
            level: "minor"
        },
        {
            name: "zowe-v?-lts",
            level: "patch"
        },
        {
            name: "next",
            prerelease: true
        },
        {
            name: "imp-2-core",
            prerelease: true,
            channel: "merged"
        }
    ],
    plugins: [
        ["@octorelease/changelog", {
            "displayNames": {
                "cli": "Zowe CLI",
                "core": "Core SDK",
                "imperative": "imperative",
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
            smokeTest: true
        }],
        ["@octorelease/github", {
            checkPrLabels: true,
            publishRelease: true
        }],
        "@octorelease/git"
    ]
};
