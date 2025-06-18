#!/bin/bash

FORCE_COLOR=0

mkdir -p test
cd test
values=${IMPERATIVE_TEST_CLI_SECURE_VALUES:-"anotherFakeValue,undefined"}
command="imperative-test-cli config secure $1"

cat > node_script.js <<EOF
const cp = require('child_process');
const os = require('os');
const command = '$command'.trim().split(' ');
const child = cp.spawn(command.shift(), command, { stdio: "pipe" });
const values = "$values".split(',');
child.stdout.on('data', (data) => {
  console.log(data.toString());
  if (data.toString().includes("Press ENTER to skip:") || data.toString().includes("(will be hidden):")) {
    child.stdin.write(values.shift() + os.EOL);
    if (values.length === 0) {
      child.stdin.end();
    }
  }
});
EOF

node node_script.js
exit $?
