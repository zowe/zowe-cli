#!/bin/bash
wn=$1
set -e

echo "================Z/OS WORKFLOWS DELETE ACTIVE-WORKFLOW ==============="
zowe zos-workflows delete active-workflow --workflow-name $wn
if [ $? -gt 0 ]
then
    exit $?
fi