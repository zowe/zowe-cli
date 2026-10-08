const fs = require("fs");

function rewriteCoverageReports({ logger }, sonarPropsContents) {
    // Workaround for https://community.sonarsource.com/t/code-coverage-doesnt-work-with-github-action/16747
    const reportPaths = /^sonar\.javascript\.lcov\.reportPaths=(.+)$/.match(sonarPropsContents)?.[1];
    if (typeof reportPaths !== "string") {
        logger.info("Unable to find the property: 'sonar.javascript.lcov.reportPaths'");
        return;
    }
    logger.info("Fixing coverage paths for SonarCloud");
    const pattern = new RegExp(process.env.GITHUB_WORKSPACE, "g");
    for (const reportPath of reportPaths.split(",")) {
        logger.debug("Report file: " + reportPath);
        const reportText = fs.readFileSync(reportPath, "utf-8");
        logger.debug("Contents before:\n" + reportText);
        fs.writeFileSync(reportPath, reportText.replace(pattern, "/github/workspace"));
        logger.debug("Contents after:\n" + fs.readFileSync(reportPath, "utf-8"));
    }
}

module.exports = async (context, _api, event) => {
    // Append Sonar properties to the sonar-project.properties file
    const sonarProps = {};
    const packageJson = JSON.parse(fs.readFileSync(fs.existsSync("lerna.json") ? "lerna.json"
        : "package.json", "utf-8"));
    sonarProps["sonar.projectVersion"] = packageJson.version;
    sonarProps["sonar.links.ci"] = `https://github.com/${context.ci.slug}/actions/runs/${process.env.GITHUB_RUN_ID}`;
    if (event.workflow_run != null) {
        sonarProps["sonar.scm.revision"] = event.workflow_run.head_sha;
    }

    // Gather information about current pull request
    let prData = event.pull_request;
    if (prData == null && context.ci.pr != null) {
        prData = {
            number: context.ci.pr,
            head: { ref: context.ci.prBranch },
            base: { ref: context.ci.branch },
        };
    }

    // Set properties for pull request or branch scanning
    if (prData != null) {
        sonarProps["sonar.pullrequest.key"] = prData.number;
        sonarProps["sonar.pullrequest.branch"] = prData.head.ref;
        sonarProps["sonar.pullrequest.base"] = prData.base.ref;
    } else {
        sonarProps["sonar.branch.name"] = event.workflow_run?.head_branch
            ?? process.env.GITHUB_REF.replace(/^refs\/heads\//, "");
    }

    // Convert properties to argument string and store it in output
    context.logger.info("Sonar scan properties:\n" + JSON.stringify(sonarProps, null, 2));
    fs.appendFileSync("sonar-project.properties", Object.entries(sonarProps).map(([k, v]) => `${k}=${v}`).join("\n"));
    const sonarPropsContents = fs.readFileSync("sonar-project.properties", "utf-8");
    context.logger.debug("All Sonar scan properties:\n" + sonarPropsContents);
    rewriteCoverageReports(context, sonarPropsContents);
}
