#!/bin/bash
dsn=$1
rfj=$2
set -e

echo "================Z/OS FILES DOWNLOAD DATASET MATCHING==============="
zowe zos-files download dsm "$1" $2 $3
if [ $? -gt 0 ]
then
    exit $?
fi
