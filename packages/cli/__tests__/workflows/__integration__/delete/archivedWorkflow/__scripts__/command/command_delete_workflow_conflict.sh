#!/bin/bash
wk=$1
wn=$2
set -e

echo "================Z/OS WORKFLOWS DELETE ARCHIVED-WORKFLOW ==============="
zowe zos-workflows delete archived-workflow --workflow-key $wk --workflow-name $wn
if [ $? -gt 0 ]
then
    exit $?
fi