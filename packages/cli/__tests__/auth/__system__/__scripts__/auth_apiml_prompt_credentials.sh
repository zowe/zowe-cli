#!/bin/bash

# Run a command against a profile that has allowedLoginMethod set to apiml-*.
# The prompted user and password are piped into the zowe command via stdin.
user=$1
pass=$2

printf "%s\n%s\n" "$user" "$pass" | zowe zosmf check status
exit $?
