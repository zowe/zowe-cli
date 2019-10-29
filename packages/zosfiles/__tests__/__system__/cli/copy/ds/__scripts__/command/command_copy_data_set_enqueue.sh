#!/bin/bash
fromDatasetName=$1
toDatasetName=$2
enqueue=$3
set -e

echo "================Z/OS FILES COPY DATA SET==============="
zowe zos-files copy data-set $fromDatasetName $toDatasetName --enqueue $enqueue
if [ $? -gt 0 ]
then
    exit $?
fi
