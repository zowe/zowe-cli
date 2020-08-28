#!/bin/bash
wk=$1
wn=$2
step=$3
set -e

echo "================Z/OS WORKFLOWS START WORKFLOW BOTH ==============="
bright zos-workflows start workflow-step $step --workflow-key $wk --workflow-name $wn
if [ $? -gt 0 ]
then
    exit $?
fi