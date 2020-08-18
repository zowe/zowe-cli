#!/bin/bash
dataSetName=$1
set -e

echo "================Z/OS FILES MIGRATE DATA SET==============="
zowe zos-files delete migrated-data-set "$dataSetName" --responseTimeout 5
if [ $? -gt 0 ]
then
    exit $?
fi
