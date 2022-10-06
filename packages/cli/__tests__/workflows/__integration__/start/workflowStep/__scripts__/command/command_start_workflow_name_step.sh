#!/bin/bash
step=$1
wn=$2
resolve=$3
wait=$4
set -e

echo "================Z/OS WORKFLOWS START WORKFLOW-NAME ==============="
zowe zos-workflows start workflow-step $step --workflow-name $wn --resolve-conflict-by $resolve $wait
if [ $? -gt 0 ]
then
    exit $?
fi