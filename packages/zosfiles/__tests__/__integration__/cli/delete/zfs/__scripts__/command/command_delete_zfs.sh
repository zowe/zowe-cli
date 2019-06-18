#!/bin/bash
fsn=$1
forsure=$2
rfj=$3
set -e

echo "================Z/OS FILES DELETE Z/OS FILE SYSTEM==============="
zowe zos-files delete zos-file-system "$fsn" $forsure $rfj
if [ $? -gt 0 ]
then
    exit $?
fi
