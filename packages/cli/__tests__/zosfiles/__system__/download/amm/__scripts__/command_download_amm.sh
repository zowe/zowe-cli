#!/bin/bash
dsn=$1
pattern=$2
rfj=$3
set -e

echo "================Z/OS FILES DOWNLOAD ALL MEMBER DATA SET==============="
zowe zos-files download amm "$1" "$2" $3 $4
if [ $? -gt 0 ]
then
    exit $?
fi