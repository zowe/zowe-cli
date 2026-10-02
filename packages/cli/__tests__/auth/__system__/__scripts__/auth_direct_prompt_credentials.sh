#!/bin/bash

# Authenticate with direct-basic using prompted credentials.
# Prompted credentials are piped into zowe command via stdin.
user=$1
pass=$2

printf "%s\n%s\n" "$user" "$pass" | zowe zosmf check status
exit $?
