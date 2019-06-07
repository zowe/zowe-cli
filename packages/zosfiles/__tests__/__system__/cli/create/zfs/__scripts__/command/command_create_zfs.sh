#!/bin/bash
fsn=$1
sec=$2
set -e

echo "================Z/OS FILES CREATE ZOS-FILE-SYSTEM==============="
zowe zos-files create zos-file-system "$fsn" $sec
if [ $? -gt 0 ]
then
    exit $?
fi
