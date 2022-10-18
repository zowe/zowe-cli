#!/bin/bash
wk=$1
resolve=$2
wait=$3
set -e

echo "================Z/OS WORKFLOWS START WORKFLOW-KEY ==============="
zowe zos-workflows start workflow-full --workflow-key $wk --resolve-conflict-by $resolve $wait
if [ $? -gt 0 ]
then
    exit $?
fi