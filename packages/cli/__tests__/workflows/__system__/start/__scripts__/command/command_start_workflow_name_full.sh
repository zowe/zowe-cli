#!/bin/bash
wn=$1
resolve=$2
wait=$3
set -e

echo "================Z/OS WORKFLOWS START WORKFLOW-NAME ==============="
zowe zos-workflows start workflow-full --workflow-name $wn --resolve-conflict-by $resolve $wait
if [ $? -gt 0 ]
then
    exit $?
fi