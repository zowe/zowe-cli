#!/bin/bash
dataSetName=$1
set -e

echo "================Z/OS FILES CREATE DATA-SET-SEQUENTIAL==============="
zowe zos-files create data-set-sequential "$dataSetName"
if [ $? -gt 0 ]
then
    exit $?
fi
