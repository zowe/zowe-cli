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
const rl = require("readline").createInterface({ input: process.stdin, output: process.stdout });

const wfPath = ".github/workflows/zowe-cli.yml";
const epPath = ".github/_act_event.json";
const opts = {
  help: ["--help", "-h"],
  verbose: ["--verbose", "-v"],
  dryRun: ["--dry-run", "--dr"],
  actParm: ["--act-param", "--ap"],
  clean: "--clean",
  node: "--node",
  os: "--os",
}

const _sleep = async (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms ?? 1000));
}
const _handle = async (fun, msg, exit=1) => {
  try {
    await fun();
  } catch (_) {
    if (msg) console.log(chalk.red(msg));
    console.error(_.toString());
    process.exit(exit);
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
      cp.spawn("docker", ["rm", c.split("'").join(""), "--force"], { stdio: "ignore" });
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
      if (c.if?.indexOf(".outcome") > 0) {
        v.steps[i].if = c.if.replaceAll(".outcome == 'success'", ".success");
        v.steps[i].if = c.if.replaceAll(".outcome == 'failure'", ".success");
      }

      // Replace Upload Artifacts
      if (c.uses?.indexOf("actions/upload-artifact") >= 0) {
        // TODO: Research support for wildcards
        v.steps[i] = {
          ...c,
          run: `mkdir -p ${artPath} && tar -c${verbose ? 'v' : ''}f ${artPath}/${c.with.name} ${c.with.path.split('\n').join(' ')}`
        };
        delete v.steps[i].uses;
        delete v.steps[i].with;
      } else
      // Replace Download Artifacts
      if (c.uses?.indexOf("actions/download-artifact") >= 0) {
        // TODO: Research support for wildcards
        v.steps[i] = {
          ...c,
          run: `tar -x${verbose ? 'v' : ''}f ${artPath}/${c.with.name}`
        };
        delete v.steps[i].uses;
        delete v.steps[i].with;
        } else {
        // ID specific actions
        switch (c.id) {
          case "unlock-keyring":
          case "upload-codecov": {
            v.steps[i] = {
              ...c,
              run: "echo Skip: " + c.id
            }
            if (c.uses) delete v.steps[i].uses;
            if (c.with) delete v.steps[i].with;
            break;
          }
          case "install-rust": {
            v.steps[i] = {
              ...c,
              // run: "yum install cargo -y\ncargo --version\n"
              run: "apt update -y\napt install build-essential curl -y\ncurl https://sh.rustup.rs -sSf > __install_rust.sh\nchmod u+x __install_rust.sh\n./__install_rust.sh -y\nsource $HOME/.cargo/env\ncargo --version\n"
            };
            delete v.steps[i].uses;
            delete v.steps[i].with;
            break;
          }
          case "build-binary": {
            v.steps[i] = {
              ...c,
              // run: "yum install cargo -y\ncargo --version\n"
              run: "source $HOME/.cargo/env\ncargo --version\n" + c.run
            };
            break;
          }
          case "unit":
          case "integration": {
            // workaround for issue https://github.com/nektos/act/issues/442
            v.steps[i] = {
              ...c,
              run: c.run + " || true"
            }
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
    fs.writeFileSync(genWfPath, yaml.dump(wf, { indent: 2, lineWidth: -1 }), { flag: "w" });
  }, `Unable to write "${genWfPath}"`);

  if (process.argv.indexOf(opts.dryRun[0]) > 0 || process.argv.indexOf(opts.dryRun[1]) > 0) {
    console.log("New workflow saved:", genWfPath);
  } else {
    // Execute workflow locally
    console.log("Executing new workflow...");
    await _sleep();
    const actArgs = [`-r${verbose ? 'v' : ''}W`, genWfPath, "-e", epPath];
    let extraParms = "";
    if (process.argv.indexOf(opts.actParm[0]) >= 0 || process.argv.indexOf(opts.actParm[1]) >= 0) {
      process.argv.forEach((_v, _i) => {
        if (_v === opts.actParm[0] || _v === opts.actParm[1]) {
          if (extraParms !== "") extraParms += " ";
          extraParms += "-P " + process.argv[_i + 1];
        }
      });
      if (extraParms !== "") actArgs.push(...extraParms.split(' '));
    }
    const runAct = cp.spawn("act", actArgs, { stdio: "inherit" });

    runAct.on("close", async () => {
      console.log("Copying existing artifacts...");
      await _sleep();
      const testPath = path.resolve(__dirname, "..", "__tests__", "__results__", "nektos_act");
      let copyPath = null;
      _handle(() => {
        copyPath = path.join(JSON.parse(cp.execSync("docker inspect act-toolcache").toString().trim())[0].Mountpoint, "artifacts");
        fs.mkdirSync(copyPath, { recursive: true });
        fs.mkdirSync(testPath, { recursive: true });
        cp.execSync(`tar -zc${verbose ? 'v' : ''}f __act__artifacts.tgz -C ${copyPath} .`);
        cp.execSync(`tar -zx${verbose ? 'v' : ''}f __act__artifacts.tgz -C ${testPath}`);
        fs.unlinkSync("__act__artifacts.tgz");
        console.log("Artifacts saved to:", testPath);
      }, `Unable to copy artifacts to: ${testPath}`);

      if (copyPath != null) {
        _handle(() => {
          console.log("Removing cached artifacts:", copyPath);
          if (process.version.startsWith("v16")) {
            fs.rmSync(copyPath, { recursive: true, force: true }); // requires node 14.14.0
          } else {
            fs.rmdirSync(copyPath, { recursive: true, force: true }); // deprecated in node 16
          }
        }, `Unable to remove cached artifacts from: ${copyPath}`);
      }
    });
  }
}

async function help() {
  console.log(`
Usage:
- npm run test: act
- npm run test: act -- -h
- npm run test: act -- --help
- npm run test: act -- --dr
- npm run test: act -- --dry-run
- npm run test: act -- --clean
- npm run test: act -- --clean --verbose
- npm run test: act -- --node 16.x
- npm run test: act -- --node 16.x -v
- npm run test: act -- --node 16.x --dr
- npm run test: act -- --node 16.x --verbose
- npm run test: act -- --node 16.x, 14.x
- npm run test: act -- --node 16.x, 14.x --os ubuntu-22.04
- npm run test: act -- --node 16.x, 14.x --os ubuntu-22.04, windows-latest
- npm run test: act -- --node 16.x --os ubuntu-22.04 --ap ubuntu-22.04=nektos/act-environments-ubuntu:18.04
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