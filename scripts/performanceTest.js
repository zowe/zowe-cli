const childProcess = require("child_process");
const moment = require("moment");
const os = require("os");
const {IO, TextUtils} = require("@brightside/imperative");
const fs = require("fs");
const {resolve, join} = require("path");

const tempHomeDir = resolve(__dirname + "/../__tests__/__results__/performance");
const resultFile = tempHomeDir + "/results.txt";
IO.createDirsSyncFromFilePath(resultFile);
const resultJSONFile = join(tempHomeDir, `results_${moment().format('x')}.json`);
const packageName = "@brightside/core";
const binName = "bright";

const header = `Performance Tests\nCurrent time ${moment()}\nPlatform '${os.platform()}'. Architecture '${os.arch()}'\n` +
    `Total Memory: ${os.totalmem()}. Free memory ${os.freemem()}\n` +
    `Number of CPUs ${os.cpus().length}.\n` +
    `User name: ${os.userInfo().username}\n`;
console.log(header);
IO.writeFile(resultFile, header);

const results = [];

/**
 * Set the current home directory
 */
const env = JSON.parse(JSON.stringify(process.env)); // copy the current environmental variables
env.ZOWE_CLI_HOME = tempHomeDir;
deleteHomeDirectory();
uninstallBrightside();

/**
 * Execute our list of performance test tasks here
 */
results.push(execTimed(`npm install -g ${packageName}@next`, "Install @next version of Brightside"));
results.push(execTimed(`${binName} --help`, `Issue ${binName} --help (no plugins) `));
results.push(execTimed(`${binName} profiles list zosmf --rfj`, "List zosmf profiles (no plugins) "));
results.push(execTimed(`${binName} plugins install @brightside/filemasterplus`, "Install filemaster plugin "));
results.push(execTimed(`${binName} --help`, `Issue ${binName} --help (1 plugin) `));
results.push(execTimed(`${binName} plugins install @brightside/endevor`, "Install endevor plugin (with filemaster installed) "));
results.push(execTimed(`${binName} --help`, `Issue ${binName} --help (2 plugins) `));
results.push(execTimed(`${binName} profiles list zosmf --rfj`, "List zosmf profiles (2 plugins) "));

/**
 * Get a report of the results
 *
 * First, add human-readable keys to the result object
 */
const stringifiedResults = results.map(function (result) {
    const newResult = JSON.parse(JSON.stringify(result)); // copy the result before modifying
    if (newResult.Passed != null) {
        newResult.Passed = newResult.Passed ? TextUtils.chalk.green(":)") : TextUtils.chalk.red("X");
    }
    newResult["Elapsed Time (ms)"] = newResult.elapsedTime;
    newResult.Task = newResult.label;
    delete newResult.label;
    delete newResult.elapsedTime;
    return newResult;
});
const resultTable = TextUtils.getTable(stringifiedResults, "blue", undefined, undefined, true);
console.log("\n" + resultTable);
IO.writeFile(resultFile, resultTable);
IO.writeFile(resultJSONFile, JSON.stringify({header, results}, null, 2));

/**
 * Execute a command synchronously and time how long it takes to execute
 * @param command - the command to execute
 * @param label - label for the action you are performing with this command
 * @param expectedTime - the amount of time in milliseconds you expect this command to take
 */
function execTimed(command, label, expectedTime) {
    console.log("Running '%s'\n", command);
    const beforeTimeStamp = moment();
    const outputFileName = join(tempHomeDir, "output/" + label + ".txt");
    IO.createDirsSyncFromFilePath(outputFileName);
    const outputFileStream = fs.openSync(outputFileName, "w+");

    childProcess.execSync(command, {env, stdio: ["inherit", outputFileStream, outputFileStream]});
    const afterTimeStamp = moment();
    const elapsedTime = afterTimeStamp.diff(beforeTimeStamp);
    let timeGreaterThanExpected = undefined;
    const result = {label, elapsedTime};
    if (expectedTime != null) {
        timeGreaterThanExpected = elapsedTime > expectedTime;
        if (timeGreaterThanExpected) {
            result.Passed = false;
        } else if (timeGreaterThanExpected === false) {
            // don't set timeGreaterThanExpected if there's no expected time
            result.Passed = true;
        }
    }

    return result;
}

/**
 * Delete the temporary brightside home directory
 */
function deleteHomeDirectory() {
    console.log("Deleting %s...", tempHomeDir);
    try {
        require("rimraf").sync(tempHomeDir);
    } catch (rimrafError) {
        throw new Error("Failed to delete " + tempHomeDir + ". Rimraf error:" + rimrafError);
    }
}

function uninstallBrightside() {
    console.log("Uninstalling %s before global install\n", packageName);
    const outputFileName = join(tempHomeDir, "output/uninstall.txt");
    IO.createDirsSyncFromFilePath(outputFileName);
    const outputFileStream = fs.openSync(outputFileName, "w+");
    childProcess.execSync(`npm uninstall -g ${packageName}`, {
        env,
        stdio: ["inherit", outputFileStream, outputFileStream]
    });
}
