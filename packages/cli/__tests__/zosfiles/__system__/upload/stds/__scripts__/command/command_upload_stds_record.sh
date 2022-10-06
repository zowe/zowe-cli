#!/bin/bash
set -e
dsname=$1
recordFile=$2

echo "========= Z/OS FILES UPLOAD FROM STDIN ========="
cat "$recordFile" | zowe zos-files upload stdin-to-data-set "$dsname" --record

if [ $? -gt 0 ]
then
    exit $?
fi
