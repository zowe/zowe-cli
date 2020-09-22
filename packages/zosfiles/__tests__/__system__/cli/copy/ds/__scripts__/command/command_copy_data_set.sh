#!/bin/bash
fromDataSet=$1
toDataSet=$2
options=$3
set -e

echo "================Z/OS FILES COPY DS==============="
zowe zos-files copy data-set $fromDataSet $toDataSet $options

if [ $? -gt 0 ]
then
    exit $?
fi
