#!/bin/bash
dataSetName=$1
set -e

echo "================Z/OS FILES DELETE MIGRATED DATA SET==============="
zowe zos-files delete migrated-data-set "$dataSetName" 
if [ $? -gt 0 ]
then
    exit $?
fi
