#!/bin/bash
dataSetName=$1
set -e

echo "================Z/OS FILES MIGRATE DATA SET==============="
zowe zos-files hMigrate data-set "$dataSetName" --wait
if [ $? -gt 0 ]
then
    exit $?
fi
