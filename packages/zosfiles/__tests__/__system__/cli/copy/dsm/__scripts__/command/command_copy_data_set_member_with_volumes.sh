#!/bin/bash
fromDataSetName=$1
fromDataSetMemberName=$2
toDataSetName=$3
toDataSetMemberName=$4
fromDataSetVolume=$5
toDataSetVolume=$6
set -e

echo "================Z/OS FILES COPY DATA SET==============="
zowe zos-files copy data-set-member "$fromDataSetName" "$fromDataSetMemberName" "$toDataSetName" "$toDataSetMemberName" --from-volume "$fromDataSetVolume" --to-volume "$toDataSetVolume"
if [ $? -gt 0 ]
then
    exit $?
fi
