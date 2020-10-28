#!/bin/bash
wk=$1
wn=$2
set -e

echo "================Z/OS WORKFLOWS DELETE ACTIVE-WORKFLOW ==============="
bright zos-workflows delete active-workflow --workflow-key $wk --workflow-name $wn
if [ $? -gt 0 ]
then
    exit $?
fi