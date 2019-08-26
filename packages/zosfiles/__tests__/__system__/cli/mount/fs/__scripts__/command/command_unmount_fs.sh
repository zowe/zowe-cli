#!/bin/bash
fsn=$1
rfj=$2
set -e

echo "================Z/OS FILES UNMOUNT FILE SYSTEM==============="
zowe zos-files unmount fs "$fsn" $rfj
exit $?
