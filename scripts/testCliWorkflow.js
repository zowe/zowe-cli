/*
* This program and the accompanying materials are made available under the terms of the
* Eclipse Public License v2.0 which accompanies this distribution, and is available at
* https://www.eclipse.org/legal/epl-v20.html
*
* SPDX-License-Identifier: EPL-2.0
*
* Copyright Contributors to the Zowe Project.
*
*/

/**
 * Run Github workflows locally
 *
 * Steps:
 * 1. Verifies that act is installed
 * 2. Reads given workflow (e.g. zowe-cli.yml)
 * 3. Replaces all known steps that could fail
 * 4. Generates a .github/_act_<workflow-name>.yml
 * 5. Executes `act -rW .github/_act_<workflow-name>.yml -e .github/_act_event.json
 * Creates a custom yaml file for running locally with act
 */
const cp = require("child_process");
const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");
const chalk = require("chalk");
const rl = require("readline").createInterface({input: process.stdin, output: process.stdout});

const wfPath = ".github/workflows/zowe-cli.yml";
const epPath = ".github/_act_event.json";
const opts = {
  help: ["--help", "-h"],
  verbose: ["--verbose", "-v"],
  dryRun: ["--dry-run", "--dr"],
  clean: "--clean",
  node: "--node",
  os: "--os",
}

const _sleep = async (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms ?? 1000));
}
const _handle = async (fun, msg) => {
  try {
    await fun();
  } catch(_) {
    if (msg) console.log(chalk.red(msg));
    console.error(_.toString());
    process.exit(1);
  }
}

const _yesno = async (q) => {
  const question = (str) => new Promise(resolve => rl.question(str, resolve));
  const res = (await question(q)) ?? "no";
  return res.toLowerCase() === "yes" || res.toLowerCase() === "y";
}

async function clean() {
  const containers = cp.spawnSync("docker", ["ps", "--filter", "name=^act-", "--format", "'{{ .Names }}'"]).stdout.toString().trim().split("\n");
  for (const c of containers) {
    if (c === "") continue;
    if (await _yesno(`Remove Container: ${c}\nAre you sure? [y/n]`)) {
      cp.spawn("docker", ["rm", c.split("'").join(""), "--force"], {stdio: "ignore"});
    } else {
      console.log(`Skip Container: ${c}`);
    }
    console.log();
    await _sleep();
  }
}

async function main() {
  // Check nektos/act version
  _handle(() => {
    console.log(`Using "nektos/act", ${cp.spawnSync("act", ["--version"]).stdout.toString().trim()}`);
  }, `Please install "act", https://github.com/nektos/act`);
  await _sleep();
  const verbose = process.argv.indexOf(opts.verbose[0]) > 0 || process.argv.indexOf(opts.verbose[1]) > 0;

  // Read given workflow
  let wf;
  _handle(() => {
    wf = yaml.load(fs.readFileSync(path.resolve(__dirname, "..", wfPath)));
  }, `Unable to read "${wfPath}"`);

  // Handle Node versions and OS runners
  let osVersion = null;
  if (process.argv.indexOf(opts.os) > 0) {
    osVersion = process.argv[process.argv.indexOf(opts.os) + 1];
  }
  let nodeVersion = null;
  if (process.argv.indexOf(opts.node) > 0) {
    nodeVersion = process.argv[process.argv.indexOf(opts.node) + 1];
  }
  for (const [k, v] of Object.entries(wf.jobs)) {
    if (v.strategy?.matrix) {
      if (nodeVersion) v.strategy.matrix["node-version"] = nodeVersion.split(",");
      if (osVersion) v.strategy.matrix.os = osVersion.split(",");
    }

    const artPath = "/toolcache/artifacts";
    for (const [i, c] of v.steps.entries()) {
      // Workaround for https://github.com/nektos/act/issues/465
      if(c.if?.indexOf(".outcome") > 0) {
        v.steps[i].if = c.if.replaceAll(".outcome == 'success'", ".success");
        v.steps[i].if = c.if.replaceAll(".outcome == 'failure'", ".success");
      }

      // Replace Upload Artifacts
      if (c.uses?.indexOf("actions/upload-artifact") >= 0) {
        // TODO: Research support for wildcards
        v.steps[i] = {
          ...v.steps[i],
          run: `mkdir -p ${artPath} && tar -c${verbose ? 'v' : ''}f ${artPath}/${c.with.name} ${c.with.path.split('\n').join(' ')}`
        };
        delete v.steps[i].uses;
        delete v.steps[i].with;
      } else
      // Replace Download Artifacts
      if (c.uses?.indexOf("actions/download-artifact") >= 0) {
        // TODO: Research support for wildcards
        v.steps[i] = {
          ...v.steps[i],
          run: `tar -x${verbose ? 'v' : ''}f ${artPath}/${c.with.name}`
        };
        delete v.steps[i].uses;
        delete v.steps[i].with;
      } else {
        // ID specific actions
        switch (c.id) {
          case "install-rust": {
            v.steps[i] = {
              name: c.name,
              run: "yum install cargo -y\ncargo --version\n"
            };
            break;
          }
        }
      }
    }
  }

  // Output generated workflow
  const genWfPath = path.resolve(__dirname, "../.github", `_act_${path.basename(wfPath)}`);
  console.log("Generating new workflow...");
  await _sleep();
  _handle(() => {
    fs.writeFileSync(genWfPath, yaml.dump(wf, {indent: 2, lineWidth: -1}), {flag: "w"});
  }, `Unable to write "${genWfPath}"`);

  if (process.argv.indexOf(opts.dryRun[0]) > 0 || process.argv.indexOf(opts.dryRun[1]) > 0) {
    console.log("New workflow saved:", genWfPath);
  } else {
    // Execute workflow locally
    console.log("Executing new workflow...");
    await _sleep();
    cp.spawn("act", [`-r${verbose ? 'v' : ''}W`, genWfPath, "-e", epPath], {stdio: "inherit"});
  }
}

async function help() {
  console.log(`
Usage:
- npm run test:act
- npm run test:act -- -h
- npm run test:act -- --help
- npm run test:act -- --dr
- npm run test:act -- --dry-run
- npm run test:act -- --clean
- npm run test:act -- --clean --verbose
- npm run test:act -- --node 16.x
- npm run test:act -- --node 16.x -v
- npm run test:act -- --node 16.x --dr
- npm run test:act -- --node 16.x --verbose
- npm run test:act -- --node 16.x,14.x
- npm run test:act -- --node 16.x,14.x --os ubuntu-latest
- npm run test:act -- --node 16.x,14.x --os ubuntu-latest,windows-latest
`);
}

(async () => {
  if (process.argv.indexOf(opts.help[0]) > 0 || process.argv.indexOf(opts.help[1]) > 0) {
    await help();
  } else if (process.argv.indexOf(opts.clean) > 0) {
    await clean();
  } else {
    await main();
  }
  rl.close();
})();