#!/bin/bash
fromDatasetName=$1
toDatasetName=$2
set -e

echo "================Z/OS FILES COPY DATA SET==============="
zowe zos-files copy data-set $fromDatasetName $toDatasetName
if [ $? -gt 0 ]
then
    exit $?
fi
