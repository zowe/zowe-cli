#!/bin/bash
fsn=$1
vols=$2
args=$3
set -e

echo "================Z/OS FILES CREATE ZOS-FILE-SYSTEM==============="
zowe zos-files create zos-file-system "$fsn" --volumes $vols $args
if [ $? -gt 0 ]
then
    exit $?
fi
