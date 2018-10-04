/**
 * Read in a directory containing json files of runs of scripts/performanceTest.js
 * from different systems, and analyze the results, providing a summary
 */

const fs = require("fs");
const {TextUtils} = require("@brightside/imperative");
const {resolve} = require("path");
const jsonFilesDirectory = resolve(process.argv[2]);
if (jsonFilesDirectory == null) {
    console.error("You must specify a directory containing performance test JSON files as the " +
        "first positional argument to this script.");
    process.exit(1);
}

console.log("Analyzing performance test results in the directory '%s'", jsonFilesDirectory);
const filesInDir = fs.readdirSync(jsonFilesDirectory);
const jsonFiles = [];
for (const file of filesInDir) {
    if (file.indexOf(".json") >= 0) {
        jsonFiles.push(file);
    }
}

const finalResults = {};

for (const file of jsonFiles) {
    const jsonResult = require(resolve(jsonFilesDirectory + "/" + file));
    for (const result of jsonResult.results) {
        if (finalResults[result.label] == null) {
            // if this is the first time we've seen this label, initialize the result for the task
            finalResults[result.label] = {
                longest: -1,
                shortest: 99999999999999999999999999999,
                numResults: 0,
                total: 0,
                average: 0
            };
        }

        finalResults[result.label].total += result.elapsedTime;
        finalResults[result.label].numResults++;
        if (finalResults[result.label].longest < result.elapsedTime) {
            finalResults[result.label].longest = result.elapsedTime;
        }
        if (finalResults[result.label].shortest > result.elapsedTime) {
            finalResults[result.label].shortest = result.elapsedTime;
        }
    }
}

for (const label of Object.keys(finalResults)) {
    finalResults[label].average = (finalResults[label].total / finalResults[label].numResults).toFixed(2);
}

/**
 * Get a report of the results
 *
 * First, add human-readable keys to the result object
 */
const stringifiedResults = Object.keys(finalResults).map(function (label) {
    const result = finalResults[label];
    const newResult = {};
    newResult.Task = label;
    newResult["Shortest time (ms)"] = result.shortest;
    newResult["Average time (ms)"] = result.average;
    newResult["Longest time (ms)"] = result.longest;
    newResult["Number of tests"] = result.numResults;
    delete newResult.elapsedTime;
    return newResult;
});

const resultTable = TextUtils.getTable(stringifiedResults, "blue", undefined, undefined, true);
console.log("\n" + resultTable);
