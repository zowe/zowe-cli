#!/bin/bash
sn=$1
wn=$2
rcb=$3
set -e

echo "================Z/OS WORKFLOWS START WORKFLOW-NAME ==============="
bright zos-workflows start workflow-step $sn --workflow-name $wn --resolve-conflict-by $rcb
if [ $? -gt 0 ]
then
    exit $?
fi