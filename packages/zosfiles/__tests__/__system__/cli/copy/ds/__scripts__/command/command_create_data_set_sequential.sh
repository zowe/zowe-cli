#!/bin/bash
dataSet=$1
volume=$2
set -e

echo "================Z/OS FILES CREATE PDS==============="
zowe zos-files create data-set-sequential "$dataSet" --volume-serial $volume
if [ $? -gt 0 ]
then
    exit $?
fi
