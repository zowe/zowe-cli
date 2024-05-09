#!/bin/bash
wname=$1
definition=$2
sysname=$3
owner=$4
set -e

echo "================Z/OS WORKFLOWS CREATE DATA-SET ==============="
zowe zos-workflows create workflow-from-data-set $wname --data-set "$definition" --system-name $sysname --owner $owner $5
if [ $? -gt 0 ]
then
    exit $?
fi