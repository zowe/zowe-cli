#!/bin/bash
fromDatasetName=$1
toDatasetName=$2
fromVolume=$3
toVolume=$4
set -e

echo "================Z/OS FILES COPY DATA SET==============="
zowe zos-files copy data-set $fromDatasetName $toDatasetName --from-volume $fromVolume --to-volume $toVolume
if [ $? -gt 0 ]
then
    exit $?
fi
