#!/bin/bash
fsn=$1
md=$2
set -e

echo "================Z/OS FILES MOUNT FILE-SYSTEM==============="
zowe zos-files mount fs "$fsn" "$md" --user ibmuser --pass 123456 --host google.com
exit $?
