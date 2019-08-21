#!/bin/bash
fsn=$1
rfj=$2
set -e

echo "================Z/OS FILES LIST FILE-SYSTEM==============="
zowe zos-files list zfs -f "$fsn" $rfj
exit $?
