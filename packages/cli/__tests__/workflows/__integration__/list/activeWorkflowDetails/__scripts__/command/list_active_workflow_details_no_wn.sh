#!/bin/bash
wn=$1
set -e

echo "================Z/OS WORKFLOWS LIST ACTIVE-WORKFLOW-DETAILS NO WN==============="
zowe zos-workflows list active-workflow-details --workflow-name $wn
if [ $? -gt 0 ]
then
    exit $?
fi