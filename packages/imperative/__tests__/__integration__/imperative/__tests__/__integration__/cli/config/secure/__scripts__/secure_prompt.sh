#!/bin/bash
FORCE_COLOR=0
mkdir -p test
cd test

# Values should be in the format "value1 value2"
# From within a test file, you can influence how many values are provided to the prompts
#     by setting the environment variable IMPERATIVE_TEST_CLI_SECURE_VALUES
# See "cli.imperative-test-cli.config.secure.integration.subtest.ts" for an example
values=${IMPERATIVE_TEST_CLI_SECURE_VALUES:-"anotherFakeValue undefined"}

# Command should be in the format "executable pos1 pos2 $1 $2 ..."
command="imperative-test-cli config secure $1"

# Copy the handleMultiplePrompts.js script to the test directory
# This will allow for easier debugging (if needed)
handleMultiplePrompts=$(dirname $(readlink -f $0))/../../__resources__/handleMultiplePrompts.js
cat $handleMultiplePrompts > node_script.js

# Run the command using the handleMultiplePrompts.js script
node node_script.js "$command" "$values"

exit $?
