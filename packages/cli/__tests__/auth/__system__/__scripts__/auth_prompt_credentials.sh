#!/bin/bash

# Run a command that prompts for credentials.
# The prompted user and password are piped into the zowe command via stdin.
user=$1
pass=$2

(printf "%s\n" "$user"; sleep 2; printf "%s\n" "$pass") | zowe zosmf check status
exit $?
