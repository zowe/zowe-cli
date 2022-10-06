#!/bin/bash
wn=$1
set -e

echo "================Z/OS WORKFLOWS LIST ACTIVE-WORKFLOW-DETAILS SKIP SUMMARY==============="
zowe zos-workflows list active-workflow-details --workflow-name $wn --sws
if [ $? -gt 0 ]
then
    exit $?
fi