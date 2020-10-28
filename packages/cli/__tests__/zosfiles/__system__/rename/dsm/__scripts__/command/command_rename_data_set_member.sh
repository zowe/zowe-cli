#!/bin/bash
dataSetName=$1
beforeMemberName=$2
afterMemberName=$3
set -e

echo "================Z/OS FILES RENAME DSM==============="
zowe zos-files rename data-set-member $dataSetName $beforeMemberName $afterMemberName $4

if [ $? -gt 0 ]
then
    exit $?
fi
