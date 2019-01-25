#!/bin/bash
set -e

# Generate console name: 6 characters + "CN"
CONSOLE_NAME=`cat /dev/urandom | tr -dc '[:upper:]' | fold -w 6 | head -n 1`
CONSOLE_NAME="${CONSOLE_NAME}CN"

# Ensure that console doesn't exist
bright console issue cmd "SETCON DELETE,CN=${CONSOLE_NAME}" >/dev/null 2>/dev/null

# Do the test
bright console issue cmd "D T" --cn ${CONSOLE_NAME}
RESULT=$?

# Do a cleanup
bright console issue cmd "SETCON DELETE,CN=${CONSOLE_NAME}" >/dev/null 2>/dev/null

exit ${RESULT}
