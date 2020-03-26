#!/bin/bash
dataSetName=$1
set -e

echo "================Z/OS FILES MIGRATE DATA SET==============="
zowe zos-files hRecall data-set "$dataSetName" 
if [ $? -gt 0 ]
then
    exit $?
fi
