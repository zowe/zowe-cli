#!/bin/bash
fromDataSet=$1
toDataSet=$2
set -e

echo "================Z/OS FILES COPY DS==============="
zowe zos-files copy data-set $fromDataSet $toDataSet

if [ $? -gt 0 ]
then
    exit $?
fi
