#!/bin/bash
set -e
dsname=$1
binaryFile=$2

echo "========= Z/OS FILES UPLOAD FROM STDIN ========="
cat "$binaryFile" | zowe zos-files upload stdin-to-data-set "$dsname" --binary

if [ $? -gt 0 ]
then
    exit $?
fi
