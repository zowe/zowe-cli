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

// The following property need to be set for the HTML report @TODO figure out how to get this nicely on jenkins
//System.setProperty("hudson.model.DirectoryBrowserSupport.CSP", "")

/**
 * The root results folder for items configurable by environmental variables
 */
def TEST_RESULTS_FOLDER = "__tests__/__results__/ci"

/**
 * The location of the unit test results
 */
def UNIT_RESULTS = "${TEST_RESULTS_FOLDER}/unit"

/**
 * The location of the integration test results
 */
def INTEGRATION_RESULTS = "${TEST_RESULTS_FOLDER}/integration"

/**
* Development branches considered for release purposes
*/ 
def DEV_BRANCH = [
    master: "master",
    beta: "beta",
    latest: "latest",
    incremental: "lts-incremental",
    stable: "lts-stable",
]

/**
* List of release branches
*/ 
def RELEASE_BRANCHES = [DEV_BRANCH.master, DEV_BRANCH.beta, DEV_BRANCH.latest, DEV_BRANCH.incremental, DEV_BRANCH.stable]

/**
 * List of people who will get all emails for master builds
 */
def MASTER_RECIPIENTS_LIST = "cc:christopher.wright@broadcom.com, cc:fernando.rijocedeno@broadcom.com, cc:michael.bauer2@broadcom.com, cc:mark.ackert@broadcom.com, cc:daniel.kelosky@broadcom.com"

/**
 * The result string for a successful build
 */
def BUILD_SUCCESS = 'SUCCESS'

/**
 * The result string for an unstable build
 */
def BUILD_UNSTABLE = 'UNSTABLE'

/**
 * The result string for a failed build
 */
def BUILD_FAILURE = 'FAILURE'

/**
 * The user's name for git commits
 */
def GIT_USER_NAME = 'zowe-robot'

/**
 * The user's email address for git commits
 */
def GIT_USER_EMAIL = 'zowe.robot@gmail.com'

/**
 * The base repository url for github
 */
def GIT_REPO_URL = 'github.com/zowe/zowe-cli.git'

/**
 * The credentials id field for the authorization token for GitHub stored in Jenkins
 */
def GIT_CREDENTIALS_ID = 'zowe-robot-github'

/**
 * A command to be run that gets the current revision pulled down
 */
def GIT_REVISION_LOOKUP = 'git log -n 1 --pretty=format:%h'

/**
 * The credentials id field for the artifactory username and password
 */
def ARTIFACTORY_CREDENTIALS_ID = 'GizaArtifactory'

/**
 * The email address for the artifactory
 */
def ARTIFACTORY_EMAIL = GIT_USER_EMAIL

/**
 * This is the product name used by the build machine to store information about
 * the builds
 */
def PRODUCT_NAME = "Zowe CLI"

/**
 * Release branches
 */
def RELEASE_BRANCHES = ["1.0.0", "lts-stable", "lts-incremental", /*"latest"*/] // Remove latest until GA

// Setup conditional build options. Would have done this in the options of the declarative pipeline, but it is pretty
// much impossible to have conditional options based on the branch :/
def opts = []

if (RELEASE_BRANCHES.contains(BRANCH_NAME)) {
    // Only keep 20 builds
    opts.push(buildDiscarder(logRotator(numToKeepStr: '20')))

    // Concurrent builds need to be disabled on the master branch because
    // it needs to actively commit and do a build. There's no point in publishing
    // twice in quick succession
    opts.push(disableConcurrentBuilds())
} else {
    // Only keep 5 builds on other branches
    opts.push(buildDiscarder(logRotator(numToKeepStr: '5')))
}

properties(opts)

pipeline {
    agent {
        label 'ca-jenkins-agent'
    }

    environment {
        // Environment variable for flow control. Tells most of the steps if they should build.
        SHOULD_BUILD = "true"

        // Environment variable for flow control. Indicates if the git source was updated by the pipeline.
        GIT_SOURCE_UPDATED = "false"
    }

    stages {
        /************************************************************************
         * STAGE
         * -----
         * Check for CI Skip
         *
         * TIMEOUT
         * -------
         * 2 Minutes
         *
         * EXECUTION CONDITIONS
         * --------------------
         * - Always
         *
         * DECRIPTION
         * ----------
         * Checks for the [ci skip] text in the last commit. If it is present,
         * the build is stopped. Needed because the pipeline does do some simple
         * git commits on the master branch for the purposes of version bumping.
         *
         * OUTPUTS
         * -------
         * SHOULD_BUILD will be set to 'false' if [ci skip] is found in the
         * commit text.
         ************************************************************************/
        stage('Check for CI Skip') {
            steps {
                timeout(time: 2, unit: 'MINUTES') {
                    script {
                        // We need to keep track of the current commit revision. This is to prevent the condition where
                        // the build starts on master and another branch gets merged to master prior to version bump
                        // commit taking place. If left unhandled, the version bump could be done on latest master branch
                        // code which would already be ahead of this build.
                        BUILD_REVISION = sh returnStdout: true, script: GIT_REVISION_LOOKUP

                        // This checks for the [ci skip] text. If found, the status code is 0
                        result = sh returnStatus: true, script: 'git log -1 | grep \'.*\\[ci skip\\].*\''
                        if (result == 0) {
                            echo '"ci skip" spotted in the git commit. Aborting.'
                            SHOULD_BUILD = "false"
                        }
                    }
                }
            }
        }

        /************************************************************************
         * STAGE
         * -----
         * Install Dependencies
         *
         * TIMEOUT
         * -------
         * 10 Minutes
         *
         * EXECUTION CONDITIONS
         * --------------------
         * - SHOULD_BUILD is true
         * - The build is still successful
         *
         * DESCRIPTION
         * -----------
         * Logs into the open source registry and installs all the dependencies
         *
         * OUTPUTS
         * -------
         * None
         ************************************************************************/
        stage('Install Dependencies') {
            when {
                expression {
                    return SHOULD_BUILD == 'true'
                }
            }
            steps {
                timeout(time: 10, unit: 'MINUTES') {
                    echo 'Installing Dependencies'

                    withCredentials([usernamePassword(credentialsId: ARTIFACTORY_CREDENTIALS_ID, usernameVariable: 'USERNAME', passwordVariable: 'PASSWORD')]) {
                        sh "expect -f ./jenkins/npm_login.expect $USERNAME $PASSWORD \"$ARTIFACTORY_EMAIL\""
                    }

                    sh 'npm install'
                    sh 'npm logout'
                }
            }
        }

        /************************************************************************
         * STAGE
         * -----
         * Build
         *
         * TIMEOUT
         * -------
         * 10 Minutes
         *
         * EXECUTION CONDITIONS
         * --------------------
         * - SHOULD_BUILD is true
         * - The build is still successful
         *
         * DESCRIPTION
         * -----------
         * Executes the `npm run build` command to generate the application code.
         *
         * OUTPUTS
         * -------
         * Jenkins: Compiled application executable code
         ************************************************************************/
        stage('Build') {
            when {
                expression {
                    return SHOULD_BUILD == 'true'
                }
            }
            steps {
                timeout(time: 10, unit: 'MINUTES') {
                    echo 'Build'
                    sh 'npm run build'

                    sh 'tar -czvf BuildArchive.tar.gz ./lib/'
                    archiveArtifacts 'BuildArchive.tar.gz'

                }
            }
        }
      /************************************************************************
         * STAGE
         * -----
         * Audit - check for vulnerabilities
         *
         * TIMEOUT
         * -------
         * 10 Minutes
         *
         * EXECUTION CONDITIONS
         * --------------------
         * - SHOULD_BUILD is true
         * - The build is still successful
         *
         * DESCRIPTION
         * -----------
         * Runs an npm audit command to check for vulnerabilities.
         *
         * OUTPUTS
         * -------
         * None
         ************************************************************************/
        stage('Check for Vulnerabilities') {
            when {
                expression {
                    return SHOULD_BUILD == 'true'
                }
            }
            steps {
                timeout(time: 10, unit: 'MINUTES') {
                    echo 'Installing Dependencies'

                    sh 'npm run audit:public'
                }
            }
        }
        /************************************************************************
         * STAGE
         * -----
         * Test: Unit
         *
         * TIMEOUT
         * -------
         * 10 Minutes
         *
         * EXECUTION CONDITIONS
         * --------------------
         * - SHOULD_BUILD is true
         * - The build is still successful
         *
         * ENVIRONMENT VARIABLES
         * ---------------------
         * JEST_JUNIT_OUTPUT:
         * Configures the jest junit reporter's output location.
         *
         * JEST_SUITE_NAME:
         * Configures the test suite name.
         *
         * JEST_JUNIT_ANCESTOR_SEPARATOR
         * Configures the separator used for nested describe blocks.
         *
         * JEST_JUNIT_CLASSNAME:
         * Configures how test class names are output.
         *
         * JEST_JUNIT_TITLE:
         * Configures the title of the tests.
         *
         * JEST_STARE_RESULT_DIR:
         * Configures the jest stare result output directory.
         *
         * JEST_STARE_RESULT_HTML:
         * Configures the jest stare result html file name.
         *
         * DESCRIPTION
         * -----------
         * Executes the `npm run test:unit` command to perform unit tests and
         * captures the resulting html and junit outputs.
         *
         * OUTPUTS
         * -------
         * Jenkins: Unit Test Report (through junit plugin)
         * HTML: Unit Test Report
         * HTML: Unit Test Code Coverage Report
         ************************************************************************/
        stage('Test: Unit') {
            when {
                expression {
                    return SHOULD_BUILD == 'true'
                }
            }
            environment {
                JEST_JUNIT_OUTPUT = "${UNIT_RESULTS}/junit.xml"
                JEST_SUITE_NAME = "Unit Tests"
                JEST_JUNIT_ANCESTOR_SEPARATOR = " > "
                JEST_JUNIT_CLASSNAME="Unit.{classname}"
                JEST_JUNIT_TITLE="{title}"
                JEST_STARE_RESULT_DIR = "${UNIT_RESULTS}/jest-stare"
                JEST_STARE_RESULT_HTML = "index.html"
            }
            steps {
                timeout(time: 10, unit: 'MINUTES') {
                    echo 'Unit Test'

                    // Run tests but don't fail if the script reports an error
                    sh "npm run test:unit || exit 0"

                    // Capture test report
                    junit JEST_JUNIT_OUTPUT

                    cobertura autoUpdateHealth: false,
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


                    // Publish HTML report
                    publishHTML(target: [
                            allowMissing         : false,
                            alwaysLinkToLastBuild: true,
                            keepAll              : true,
                            reportDir            : JEST_STARE_RESULT_DIR,
                            reportFiles          : JEST_STARE_RESULT_HTML,
                            reportName           : "${PRODUCT_NAME} - Unit Test Report"
                    ])

                    publishHTML(target: [
                            allowMissing         : false,
                            alwaysLinkToLastBuild: true,
                            keepAll              : true,
                            reportDir            : "__tests__/__results__/unit/coverage/lcov-report",
                            reportFiles          : 'index.html',
                            reportName           :  "${PRODUCT_NAME} - Unit Test Coverage Report"
                    ])
                }
            }
        }

        /************************************************************************
         * STAGE
         * -----
         * Test: Integration
         *
         * TIMEOUT
         * -------
         * 30 Minutes
         *
         * EXECUTION CONDITIONS
         * --------------------
         * - SHOULD_BUILD is true
         * - The build is still successful
         *
         * ENVIRONMENT VARIABLES
         * ---------------------
         * JEST_JUNIT_OUTPUT:
         * Configures the jest junit reporter's output location.
         *
         * JEST_SUITE_NAME:
         * Configures the test suite name.
         *
         * JEST_JUNIT_ANCESTOR_SEPARATOR
         * Configures the separator used for nested describe blocks.
         *
         * JEST_JUNIT_CLASSNAME:
         * Configures how test class names are output.
         *
         * JEST_JUNIT_TITLE:
         * Configures the title of the tests.
         *
         * JEST_HTML_REPORTER_OUTPUT_PATH:
         * Configures the jest html reporter's output location.
         *
         * JEST_HTML_REPORTER_PAGE_TITLE:
         * Configures the jset html reporter's page title.
         *
         * TEST_SCRIPT:
         * A variable that contains the shell script that runs the integration
         * tests. So we don't have to type out a lot of text.
         *
         * DESCRIPTION
         * -----------
         * Executes the `npm run test:integration` command to perform
         * integration tests and captures the resulting html and junit outputs.
         *
         * OUTPUTS
         * -------
         * Jenkins: Integration Test Report (through junit plugin)
         * HTML: Integration Test Report
         ************************************************************************/
        stage('Test: Integration') {
            when {
                expression {
                    return SHOULD_BUILD == 'true'
                }
            }
            environment {
                JEST_JUNIT_OUTPUT = "${INTEGRATION_RESULTS}/junit.xml"
                JEST_SUITE_NAME = "Integration Tests"
                JEST_JUNIT_ANCESTOR_SEPARATOR = " > "
                JEST_JUNIT_CLASSNAME="Integration.{classname}"
                JEST_JUNIT_TITLE="{title}"
                JEST_HTML_REPORTER_OUTPUT_PATH = "${INTEGRATION_RESULTS}/index.html"
                JEST_HTML_REPORTER_PAGE_TITLE = "${BRANCH_NAME} - Integration Test"
            }
            steps {
                timeout(time: 30, unit: 'MINUTES') {
                    echo 'Integration Test'

                    // Create the custom properties file so the tests can run, however the values inside
                    // are not necessary for integration tests
                    sh "cp __tests__/__resources__/properties/default_properties.yaml __tests__/__resources__/properties/custom_properties.yaml"
                    sh "npm run test:integration || exit 0"

                    junit JEST_JUNIT_OUTPUT

                    // Publish HTML report
                    publishHTML(target: [
                            allowMissing         : false,
                            alwaysLinkToLastBuild: true,
                            keepAll              : true,
                            reportDir            : INTEGRATION_RESULTS,
                            reportFiles          : 'index.html',
                            reportName           : 'Zowe CLI - Integration Test Report'
                    ])
                }
            }
        }

         /************************************************************************
         * STAGE
         * -----
         * SonarQube Scanner
         *
         * EXECUTION CONDITIONS
         * --------------------
         * - SHOULD_BUILD is true
         * - The build is still successful and not unstable
         *
         * DESCRIPTION
         * -----------
         * Runs the sonar-scanner analysis tool, which submits the source, test resutls,
         *  and coverage results for analysis in our SonarQube server.
         * TODO: This step does not yet support branch or PR submissions properly.
         ***********************************************************************/
        stage('sonar') {
             when {
                allOf {
                    expression {
                        return SHOULD_BUILD == 'true'
                    }
                    expression {
                        return currentBuild.resultIsBetterOrEqualTo(BUILD_SUCCESS)
                    }
                }
            }
            steps {
                script {
                    def scannerHome = tool 'sonar-scanner-maven-install'
                    withSonarQubeEnv('sonar-default-server') {
                        sh "${scannerHome}/bin/sonar-scanner"
                    }
                }
            }
        }

        /************************************************************************
         * STAGE
         * -----
         * Bump Version
         *
         * TIMEOUT
         * -------
         * 5 Minutes
         *
         * EXECUTION CONDITIONS
         * --------------------
         * - SHOULD_BUILD is true
         * - The current branch is the DEV_BRANCH.master or DEV_BRANCH.beta
         * - The build is still successful and not unstable
         *
         * DESCRIPTION
         * -----------
         * Bumps the pre-release version in preparation for publishing to an npm
         * registry. It will clean out any pending changes and switch to the real
         * branch that was published (currently the pipeline would be in a
         * detached HEAD at the commit) before executing the npm command to bump
         * the version.
         *
         * The step does checking against the commit that was checked out and
         * the BUILD_REVISION that was retrieved earlier. If they do not match,
         * the commit will not be pushed and the build will fail. This handles
         * the condition where the current build made it to this step but another
         * change had been pushed to the master branch. This means that we would
         * have to bump the version of a future commit to the one we just built
         * and tested, which is a big no no. A corresponding email will be sent
         * out in this situation to explain how this condition could have occurred.
         *
         * OUTPUTS
         * -------
         * GitHub: A commit containing the bumped version in the package.json.
         *
         *         Commit Message:
         *         Bumped pre-release version <VERSION_HERE> [ci skip]
         ************************************************************************/
        stage('Bump Pre-release Version') {
            when {
                allOf {
                    expression {
                        return SHOULD_BUILD == 'true'
                    }
                    expression {
                        return currentBuild.resultIsBetterOrEqualTo(BUILD_SUCCESS)
                    }
                    expression {
                        return BRANCH_NAME.equals(DEV_BRANCH.master) || BRANCH_NAME.equals(DEV_BRANCH.beta)
                    }
                }
            }
            steps {
                timeout(time: 5, unit: 'MINUTES') {
                    echo "Bumping Version"

                    // Blow away any pending changes and pull down the master branch...
                    // this should be the same as our current commit since concurrency builds are turned
                    // off for that branch
                    sh "git reset --hard HEAD"
                    sh "git checkout ${BRANCH_NAME}"

                    // Make sure that the revision of the build and the current revision of the BRANCH_NAME match
                    script {
                        revision = sh returnStdout: true, script: GIT_REVISION_LOOKUP

                        if (BUILD_REVISION != revision) {
                            error "Build revision does not match the GitHub branch source."
                        }
                    }

                    // Configure the git environment
                    sh "git config user.name \"${GIT_USER_NAME}\""
                    sh "git config user.email \"${GIT_USER_EMAIL}\""
                    sh "git config push.default simple"

                    // This script block does the version bump, and a git commit and tag
                    script {
                        if (BRANCH_NAME.equals(DEV_BRANCH.master)) {
                            def baseVersion = sh returnStdout: true, script: 'node -e "console.log(require(\'./package.json\').version.split(\'-\')[0])"'
                            def preReleaseVersion = baseVersion.trim() + "-alpha." + new Date().format("yyyyMMddHHmm", TimeZone.getTimeZone("UTC")) 
                            sh "npm version ${preReleaseVersion} -m \"Bumped pre-release version to ${preReleaseVersion} [ci skip]\""
                        }
                        else if (BRANCH_NAME.equals(DEV_BRANCH.beta)) {
                            def baseVersion = sh returnStdout: true, script: 'node -e "console.log(require(\'./package.json\').version.split(\'-\')[0])"'
                            def preReleaseVersion = baseVersion.trim() + "-beta." + new Date().format("yyyyMMddHHmm", TimeZone.getTimeZone("UTC")) 
                            sh "npm version ${preReleaseVersion} -m \"Bumped pre-release version to ${preReleaseVersion} [ci skip]\""
                        }
                    }

                    // For debugging purposes
                    echo "Current Status of ${BRANCH_NAME}"
                    sh "git status"

                    // Do the push with credentials from the jenkins server
                    withCredentials([usernameColonPassword(credentialsId: GIT_CREDENTIALS_ID, variable: 'TOKEN')]) {
                        sh "git push https://${TOKEN}@${GIT_REPO_URL} ${BRANCH_NAME} --follow-tags"
                    }

                    script {
                        // We only get here if the source was updated
                        GIT_SOURCE_UPDATED = "true"
                    }
                }
            }
        }
        /************************************************************************
         * STAGE
         * -----
         * Deploy
         *
         * TIMEOUT
         * -------
         * 5 Minutes
         *
         * EXECUTION CONDITIONS
         * --------------------
         * - SHOULD_BUILD is true
         * - GIT_SOURCE_UPDATED is true (meaning that we were able to do the bump)
         * - The current branch is the DEV_BRANCH.master
         * - The build is still successful and not unstable
         *
         * DESCRIPTION
         * -----------
         * Deploys the current build as an npm package to an npm registry. The
         * build will be tagged as beta.
         *
         * OUTPUTS
         * -------
         * npm: A package to an npm registry
         ************************************************************************/
        stage('Deploy') {
            when {
                allOf {
                    expression {
                        return SHOULD_BUILD == 'true'
                    }
                    expression {
                        return currentBuild.resultIsBetterOrEqualTo(BUILD_SUCCESS)
                    }
                    expression {
                        return GIT_SOURCE_UPDATED == 'true' || RELEASE_BRANCHES.contains(BRANCH_NAME)
                    }
                }
            }
            steps {
                timeout(time: 5, unit: 'MINUTES') {
                    echo 'Deploy Binary'

                    // Temporarily rename this file so it doesn't cause stupid problems
                    sh 'mv .npmrc .npmrc-temp'

                    // Get the registry that we need to publish to
                    script {
                        def npmRegistry = sh returnStdout: true,
                                script: "node -e \"process.stdout.write(require('./package.json').publishConfig.registry)\""
                        sh "sudo npm config set registry ${npmRegistry.trim()}"
                    }
                    // Login to the registry before publishing
                    withCredentials([usernamePassword(credentialsId: ARTIFACTORY_CREDENTIALS_ID, usernameVariable: 'USERNAME', passwordVariable: 'PASSWORD')]) {
                        sh "expect -f ./jenkins/npm_login.expect $USERNAME $PASSWORD \"$ARTIFACTORY_EMAIL\""
                    }

                    script {
                        if (BRANCH_NAME.equals(DEV_BRANCH.master)) {
                            sh 'npm publish --tag daily'
                        }
                        else {
                            sh "npm publish --tag ${BRANCH_NAME}"
                        }
                        sh 'npm logout'
                    }
                    sh 'npm logout || exit 0'

                    // Change it back
                    sh 'mv .npmrc-temp .npmrc'
                }
            }
        }

        /************************************************************************
         * STAGE
         * -----
         * Create Bundle
         *
         * TIMEOUT
         * -------
         * 5 Minutes
         *
         * EXECUTION CONDITIONS
         * --------------------
         * - SHOULD_BUILD is true
         * - GIT_SOURCE_UPDATED is true (meaning that we were able to do the bump)
         * - The current branch is the DEV_BRANCH.master
         * - The build is still successful and not unstable
         *
         * DESCRIPTION
         * -----------
         * Creates a self-contained tgz archive so that the package can be
         * installed offline. It does this by calling a node script in
         * ./jenkins/configure-to-bundle.js which creates the needed
         * bundledDependencies property within the package.json of the project.
         *
         * After the package.json is updated, we run the `npm pack` command and
         * archive it under the name generated by the JS file.
         *
         * OUTPUTS
         * -------
         * ${package_name}-${package_version}-bundled.tgz:
         *
         * A self-contained npm package install file.
         ************************************************************************/
        stage('Create Bundle') {
            when {
                allOf {
                    expression {
                        return SHOULD_BUILD == 'true'
                    }
                    expression {
                        return currentBuild.resultIsBetterOrEqualTo(BUILD_SUCCESS)
                    }
                    expression {
                        return GIT_SOURCE_UPDATED == 'true' || RELEASE_BRANCHES.contains(BRANCH_NAME)
                    }
                }
            }
            steps {
                timeout(time: 5, unit: 'MINUTES') {
                    echo 'Archiving bundled binary file'

                    script {
                        // This script's last line of output will be the name
                        // that should be given to the stored archive.
                        def archiveName = sh([
                                returnStdout: true,
                                script: 'node ./jenkins/configure-to-bundle.js'
                        ]).trim()

                        echo 'Output from configure-to-bundle.js script'
                        echo archiveName
                        archiveName = archiveName.tokenize().last()

                        // Create the bundled package. The last line of this
                        // command is the name of the package that was generated.
                        def bundleName = sh([
                                returnStdout: true,
                                script: 'npm pack'
                        ])

                        echo 'Output from npm pack command'
                        echo bundleName
                        bundleName = bundleName.tokenize().last()

                        // Rename to the proper name and archive the artifact
                        sh "mv ${bundleName} ${archiveName}"
                        archiveArtifacts archiveName
                    }
                }
            }
        }
    }
    post {
        /************************************************************************
         * POST BUILD ACTION
         *
         * Sends out emails and logs out of the registry
         *
         * Emails are only sent out when SHOULD_BUILD is true.
         *
         * Sends out emails when any of the following are true:
         *
         * - It is the first build for a new branch
         * - The build is successful but the previous build was not
         * - The build failed or is unstable
         * - The build is on the DEV_BRANCH.master
         *
         * In the case that an email was sent out, it will send it to individuals
         * who were involved with the build and if broken those involved in
         * breaking the build. If this build is for the DEV_BRANCH.master, then an
         * additional set of individuals will also get an email that the build
         * occurred.
         ************************************************************************/
        always {
            script {
                sh 'npm logout || exit 0'

                def buildStatus = currentBuild.currentResult

                if (SHOULD_BUILD == 'true') {
                    try {
                        def previousBuild = currentBuild.getPreviousBuild()
                        def recipients = ""

                        def subject = "${currentBuild.currentResult}: Job '${env.JOB_NAME} [${env.BUILD_NUMBER}]'"
                        def consoleOutput = """
                        <p>Branch: <b>${BRANCH_NAME}</b></p>
                        <p>Check console output at "<a href="${RUN_DISPLAY_URL}">${env.JOB_NAME} [${env.BUILD_NUMBER}]</a>"</p>
                        """

                        def details = ""

                        if (previousBuild == null) {
                            details = "<p>Initial build for new branch.</p>"
                        } else if (currentBuild.resultIsBetterOrEqualTo(BUILD_SUCCESS) && previousBuild.resultIsWorseOrEqualTo(BUILD_UNSTABLE)) {
                            details = "<p>Build returned to normal.</p>"
                        }

                        // Issue #53 - Previously if the first build for a branch failed, logs would not be captured.
                        //             Now they do!
                        if (currentBuild.resultIsWorseOrEqualTo(BUILD_UNSTABLE)) {
                            // Archives any test artifacts for logging and debugging purposes
                            archiveArtifacts allowEmptyArchive: true, artifacts: '__tests__/__results__/**/*.log'
                            details = "${details}<p>Build Failure.</p>"
                        }

                        if (BRANCH_NAME == DEV_BRANCH.master) {
                            recipients = MASTER_RECIPIENTS_LIST

                            details = "${details}<p>A build of master has finished.</p>"

                            if (GIT_SOURCE_UPDATED == "true") {
                                details = "${details}<p>The pipeline was able to automatically bump the pre-release version in git</p>"
                            } else {
                                // Most likely another PR was merged to master before we could do the commit thus we can't
                                // have the pipeline automatically do it
                                details = """${details}<p>The pipeline was unable to automatically bump the pre-release version in git.
                                <b>THIS IS LIKELY NOT AN ISSUE WITH THE BUILD</b> as all the tests have to pass to get to this point.<br/><br/>

                                <b>Possible causes of this error:</b>
                                <ul>
                                    <li>A commit was made to <b>${DEV_BRANCH.master}</b> during the current run.</li>
                                    <li>The user account tied to the build is no longer valid.</li>
                                    <li>The remote server is experiencing issues.</li>
                                </ul>

                                <i>THIS BUILD WILL BE MARKED AS A FAILURE AS WE CANNOT GUARENTEE THAT THE PROBLEM DOES NOT LIE IN THE
                                BUILD AND CORRECTIVE ACTION MAY NEED TO TAKE PLACE.</i>
                                </p>"""
                            }
                        }

                        if (details != "") {
                            echo "Sending out email with details"
                            emailext(
                                    subject: subject,
                                    to: recipients,
                                    body: "${details} ${consoleOutput}",
                                    mimeType: "text/html",
                                    recipientProviders: [[$class: 'DevelopersRecipientProvider'],
                                                         [$class: 'UpstreamComitterRecipientProvider'],
                                                         [$class: 'CulpritsRecipientProvider'],
                                                         [$class: 'RequesterRecipientProvider']]
                            )
                        }
                    } catch (e) {
                        echo "Experienced an error sending an email for a ${buildStatus} build"
                        currentBuild.result = buildStatus
                    }
                }
            }
        }
    }
}
