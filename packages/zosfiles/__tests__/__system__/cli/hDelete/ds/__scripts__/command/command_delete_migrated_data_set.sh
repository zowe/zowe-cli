#!/bin/bash
dataSetName=$1
set -e

echo "================Z/OS FILES DELETE MIGRATD DATA SET==============="
zowe zos-files delete data-set "$dataSetName" 
if [ $? -gt 0 ]
then
    exit $?
fi
