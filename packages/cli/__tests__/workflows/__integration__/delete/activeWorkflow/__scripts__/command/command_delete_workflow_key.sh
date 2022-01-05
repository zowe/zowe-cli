#!/bin/bash
wk=$1
set -e

echo "================Z/OS WORKFLOWS DELETE ACTIVE-WORKFLOW ==============="
zowe zos-workflows delete active-workflow
if [ $? -gt 0 ]
then
    exit $?
fi