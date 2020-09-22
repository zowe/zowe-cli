#!/bin/bash
beforeDataSetName=$1
afterDataSetName=$2
set -e

echo "================Z/OS FILES RENAME DS==============="
zowe zos-files rename data-set $beforeDataSetName $afterDataSetName $3

if [ $? -gt 0 ]
then
    exit $?
fi
