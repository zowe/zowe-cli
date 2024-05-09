#!/bin/bash
fromDataSet=$1
toDataSet=$2
options=$3
set -e

echo "================Z/OS FILES COPY DSCLP==============="
zowe zos-files copy dsclp $fromDataSet $toDataSet $options

if [ $? -gt 0 ]
then
    exit $?
fi
