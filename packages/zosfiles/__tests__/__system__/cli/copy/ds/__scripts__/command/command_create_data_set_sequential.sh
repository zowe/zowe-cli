#!/bin/bash
dataSet=$1
set -e

echo "================Z/OS FILES CREATE PDS==============="
zowe zos-files create data-set-sequential "$dataSet"
if [ $? -gt 0 ]
then
    exit $?
fi
