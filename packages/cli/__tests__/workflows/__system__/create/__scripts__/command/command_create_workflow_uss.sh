#!/bin/bash
wname=$1
definiton=$2
sysname=$3
owner=$4
set -e

echo "================Z/OS WORKFLOWS CREATE USS-FILE ==============="
zowe zos-workflows create workflow-from-uss-file $wname --uss-file "$definiton" --system-name $sysname --owner $owner $5
if [ $? -gt 0 ]
then
    exit $?
fi