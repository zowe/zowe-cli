#!/bin/bash
wk=$1
wn=$2
set -e

echo "================Z/OS WORKFLOWS START WORKFLOW BOTH ==============="
zowe zos-workflows start workflow-full --workflow-key $wk --workflow-name $wn
if [ $? -gt 0 ]
then
    exit $?
fi