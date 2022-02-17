/*
* This program and the accompanying materials are made available under the terms of the *
* Eclipse Public License v2.0 which accompanies this distribution, and is available at *
* https://www.eclipse.org/legal/epl-v20.html                                      *
*                                                                                 *
* SPDX-License-Identifier: EPL-2.0                                                *
*                                                                                 *
* Copyright Contributors to the Zowe Project.                                     *
*                                                                                 *
*/

@Library('shared-pipelines') import org.zowe.pipelines.nodejs.NodeJSPipeline

import org.zowe.pipelines.nodejs.models.SemverLevel

/**
 * This is the product name used by the build machine to store information about
 * the builds
 */
def PRODUCT_NAME = "Zowe CLI"

node('zowe-jenkins-agent-dind') {
    // Initialize the pipeline
    def pipeline = new NodeJSPipeline(this)
    pipeline.isLernaMonorepo = true

    // Build admins, users that can approve the build and receieve emails for
    // all protected branch builds.
    pipeline.admins.add("tucker01", "gejohnston", "zfernand0", "mikebauerca", "markackert", "dkelosky", "awharn", "tjohnsonbcm")

    // Comma-separated list of emails that should receive notifications about these builds
    pipeline.emailList = "fernando.rijocedeno@broadcom.com"

    // Protected branch property definitions
    pipeline.protectedBranches.addMap([
        [name: "master", tag: "latest", dependencies: ["@zowe/imperative": "latest", "@zowe/perf-timing": "latest"], aliasTags: ["zowe-v1-lts"]],
        [name: "next", tag: "next", prerelease: "next", dependencies: ["@zowe/imperative": "next", "@zowe/perf-timing": "latest"], aliasTags: ["@zowe/cli-test-utils@latest"]],
        //[name: "zowe-v1-lts", tag: "zowe-v1-lts", level: SemverLevel.MINOR, dependencies: ["@zowe/imperative": "zowe-v1-lts", "@zowe/perf-timing": "zowe-v1-lts"]],
        [name: "lts-incremental", tag: "lts-incremental", level: SemverLevel.PATCH, dependencies: ["@brightside/imperative": "lts-incremental"]],
        [name: "lts-stable", tag: "lts-stable", level: SemverLevel.PATCH, dependencies: ["@brightside/imperative": "lts-stable"]]
    ])

    // Git configuration information
    pipeline.gitConfig = [
        email: 'zowe.robot@gmail.com',
        credentialsId: 'zowe-robot-github'
    ]

    // npm publish configuration
    pipeline.publishConfig = [
        email: pipeline.gitConfig.email,
        credentialsId: 'zowe.jfrog.io',
        scope: '@zowe'
    ]

    pipeline.registryConfig = [
        [
            email: pipeline.publishConfig.email,
            credentialsId: pipeline.publishConfig.credentialsId,
            url: 'https://zowe.jfrog.io/zowe/api/npm/npm-release/',
            scope: pipeline.publishConfig.scope
        ]
    ]

    // Initialize the pipeline library, should create 5 steps.
    pipeline.setup(nodeJsVersion: 'v16.13.1', npmVersion: '^8')

    // When we need to build the CLI with imperative from Github repo source,
    // we need lots of time to install imperative, since imperative
    // is also built from source during the NPM install.
    // When building from GitHub source, commment out the setup
    // command above, and uncomment the setup command below:
    //
    // pipeline.setup(installDependencies: [
    //     time: 15,
    //     unit: 'MINUTES'
    // ])

    // Build the application
    pipeline.build(timeout: [
        time: 5,
        unit: 'MINUTES'
    ])

    def TEST_ROOT = "__tests__/__results__/ci"
    def UNIT_TEST_ROOT = "$TEST_ROOT/unit"
    def UNIT_JUNIT_OUTPUT = "$UNIT_TEST_ROOT/junit.xml"

    // Perform a unit test and capture the results
    pipeline.test(
        name: "Unit",
        operation: {
            sh "npm run test:unit"
        },
        environment: [
            JEST_JUNIT_OUTPUT: UNIT_JUNIT_OUTPUT,
            JEST_SUIT_NAME: "Unit Tests",
            JEST_JUNIT_ANCESTOR_SEPARATOR: " > ",
            JEST_JUNIT_CLASSNAME: "Unit.{classname}",
            JEST_JUNIT_TITLE: "{title}",
            JEST_STARE_RESULT_DIR: "${UNIT_TEST_ROOT}/jest-stare",
            JEST_STARE_RESULT_HTML: "index.html",
            NODE_OPTIONS: "--max_old_space_size=4096"
        ],
        testResults: [dir: "${UNIT_TEST_ROOT}/jest-stare", files: "index.html", name: "${PRODUCT_NAME} - Unit Test Report"],
        coverageResults: [dir: "__tests__/__results__/unit/coverage/lcov-report", files: "index.html", name: "${PRODUCT_NAME} - Unit Test Coverage Report"],
        junitOutput: UNIT_JUNIT_OUTPUT,
        cobertura: [
            autoUpdateHealth: false,
            autoUpdateStability: false,
            coberturaReportFile: '__tests__/__results__/unit/coverage/cobertura-coverage.xml',
            classCoverageTargets: '85, 80, 75',
            conditionalCoverageTargets: '70, 65, 60',
            failUnhealthy: false,
            failUnstable: false,
            lineCoverageTargets: '80, 70, 50',
            maxNumberOfBuilds: 20,
            methodCoverageTargets: '80, 70, 50',
            onlyStable: false,
            sourceEncoding: 'ASCII',
            zoomCoverageChart: false
        ]
    )

    // Perform an integration test and capture the results
    def INTEGRATION_TEST_ROOT = "$TEST_ROOT/integration"
    def INTEGRATION_JUNIT_OUTPUT = "$INTEGRATION_TEST_ROOT/junit.xml"

    pipeline.test(
        name: "Integration",
        operation: {
            sh "npm run test:integration"
        },
        timeout: [time: 30, unit: 'MINUTES'],
        shouldUnlockKeyring: true,
        environment: [
            JEST_JUNIT_OUTPUT: INTEGRATION_JUNIT_OUTPUT,
            JEST_SUIT_NAME: "Integration Tests",
            JEST_JUNIT_ANCESTOR_SEPARATOR: " > ",
            JEST_JUNIT_CLASSNAME: "Integration.{classname}",
            JEST_JUNIT_TITLE: "{title}",
            JEST_STARE_RESULT_DIR: "${INTEGRATION_TEST_ROOT}/jest-stare",
            JEST_STARE_RESULT_HTML: "index.html",
            NODE_OPTIONS: "--max_old_space_size=4096"
        ],
        testResults: [dir: "$INTEGRATION_TEST_ROOT/jest-stare", files: "index.html", name: "$PRODUCT_NAME - Integration Test Report"],
        junitOutput: INTEGRATION_JUNIT_OUTPUT
    )

    //Upload Reports to Code Coverage
    pipeline.createStage(
        name: "Codecov",
        stage: {
            withCredentials([usernamePassword(credentialsId: 'CODECOV_ZOWE_CLI', usernameVariable: 'CODECOV_USERNAME', passwordVariable: 'CODECOV_TOKEN')]) {
                sh "curl -s https://codecov.io/bash | bash -s"
            }
        }
    )

    // Perform sonar qube operations
    pipeline.sonarScan()

    // Check Vulnerabilities
    pipeline.checkVulnerabilities()

    pipeline.checkChangelog(
        file: "CHANGELOG.md",
        header: "## Recent Changes"
    )

    pipeline.createStage(
        name: "Bundle Daemon Binaries",
        shouldExecute: {
            return pipeline.protectedBranches.isProtected(BRANCH_NAME)
        },
        timeout: [time: 30, unit: 'MINUTES'],
        stage: {
            def daemonVer = readProperties(file: "zowex/Cargo.toml").version
            withCredentials([usernamePassword(credentialsId: 'zowe-robot-github', usernameVariable: 'USERNAME', passwordVariable: 'TOKEN')]) {
                sh "bash jenkins/bundleDaemon.sh ${daemonVer} \"${USERNAME}:${TOKEN}\""
            }
            archiveArtifacts artifacts: "packages/cli/prebuilds/*"
        }
    )

    pipeline.createStage(
        name: "Bundle Keytar Binaries",
        shouldExecute: {
            return pipeline.protectedBranches.isProtected(BRANCH_NAME)
        },
        stage: {
            def packageJson = readJSON file: "packages/cli/package.json"
            def keytarVer = packageJson.optionalDependencies['keytar']
            withCredentials([usernamePassword(credentialsId: 'zowe-robot-github', usernameVariable: 'USERNAME', passwordVariable: 'TOKEN')]) {
                sh "bash jenkins/bundleKeytar.sh ${keytarVer} \"${USERNAME}:${TOKEN}\""
            }
            archiveArtifacts artifacts: "keytar-prebuilds.tgz"
        }
    )

    // Perform the versioning email mechanism
    pipeline.version(
        timeout: [time: 30, unit: 'MINUTES'],
        updateChangelogArgs: [
            file: "CHANGELOG.md",
            header: "## Recent Changes"
        ]
    )

    // Deploys the application if on a protected branch. Give the version input
    // 30 minutes before an auto timeout approve.
    pipeline.deploy()

    // Once called, no stages can be added and all added stages will be executed. On completion
    // appropriate emails will be sent out by the shared library.
    pipeline.end()
}
