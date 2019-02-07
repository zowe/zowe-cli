#!/bin/bash
wk=$1
rcb=$2
sn=$3
pos=$4
set -e

echo "================Z/OS WORKFLOWS START WORKFLOW-KEY ==============="
bright zos-workflows start workflow-key $wk --resolve-conflict-by $rcb --step-name $sn --perform-one-step $pos
if [ $? -gt 0 ]
then
    exit $?
fi