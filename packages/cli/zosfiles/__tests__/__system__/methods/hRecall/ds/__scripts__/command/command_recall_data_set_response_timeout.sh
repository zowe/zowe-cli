#!/bin/bash
dataSetName=$1
set -e

echo "================Z/OS FILES RECALL DATA SET==============="
zowe zos-files recall data-set "$dataSetName" --responseTimeout 5
if [ $? -gt 0 ]
then
    exit $?
fi
