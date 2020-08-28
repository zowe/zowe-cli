#!/bin/bash
set -e

# Generate console name: 6 characters + "CN"
CONSOLE_NAME=`cat /dev/urandom | tr -dc '[:upper:]' | fold -w 6 | head -n 1`
CONSOLE_NAME="${CONSOLE_NAME}CN"

# Ensure that console doesn't exist
zowe zos-console issue command "SETCON DELETE,CN=${CONSOLE_NAME}" >/dev/null 2>/dev/null

# Do the test
zowe zos-console issue command "D T" --console-name ${CONSOLE_NAME} --response-format-json
RESULT=$?

# Do a cleanup
zowe zos-console issue command "SETCON DELETE,CN=${CONSOLE_NAME}" >/dev/null 2>/dev/null

exit ${RESULT}
