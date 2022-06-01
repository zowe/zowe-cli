#!/bin/bash
set -e

echo "================Z/OS FILES DOWNLOAD DATASET MATCHING==============="
zowe zos-files download dsm "$1" $*
if [ $? -gt 0 ]
then
    exit $?
fi
