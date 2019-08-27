#!/bin/bash
fsn=$1
mp=$2
rfj=$3
set -e

echo "================Z/OS FILES MOUNT FILE-SYSTEM==============="
zowe zos-files mount file-system "$fsn" "$mp" $rfj
exit $?
