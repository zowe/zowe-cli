#!/bin/bash
step=$1
wk=$2
resolve=$3
wait=$4
set -e

echo "================Z/OS WORKFLOWS START WORKFLOW-KEY ==============="
bright zos-workflows start workflow-step $step --workflow-key $wk --resolve-conflict-by $resolve $wait
if [ $? -gt 0 ]
then
    exit $?
fi