#!/bin/bash
wk=$1
set -e

echo "================Z/OS WORKFLOWS DELETE ACTIVE-WORKFLOW ==============="
bright zos-workflows delete active-workflow --workflow-key $wk
if [ $? -gt 0 ]
then
    exit $?
fi