#!/bin/bash
sn=$1
wk=$2
rcb=$3
set -e

echo "================Z/OS WORKFLOWS START WORKFLOW-KEY ==============="
bright zos-workflows start workflow-step $sn --workflow-key $wk --resolve-conflict-by $rcb
if [ $? -gt 0 ]
then
    exit $?
fi