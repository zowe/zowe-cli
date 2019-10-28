#!/bin/bash
DataSetName=$1
set -e

echo "================Z/OS FILES COPY DATA SET==============="
zowe zos-files list data-set $DataSetName -a
if [ $? -gt 0 ]
then
    exit $?
fi
