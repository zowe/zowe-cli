#!/bin/bash
wk=$1
set -e

echo "================Z/OS WORKFLOWS DELETE WORKFLOW-KEY ==============="
bright zos-workflows delete by-workflow-key $wk
if [ $? -gt 0 ]
then
    exit $?
fi