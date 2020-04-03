#!/bin/bash
dataSetName=$1
set -e

echo "================Z/OS FILES RECALL DATA SET==============="
zowe zos-files hRecall data-set "$dataSetName" --wait
if [ $? -gt 0 ]
then
    exit $?
fi
