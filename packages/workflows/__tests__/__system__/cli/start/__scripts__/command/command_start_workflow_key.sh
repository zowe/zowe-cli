#!/bin/bash
wk=$1
set -e

echo "================Z/OS WORKFLOWS START WORKFLOW-KEY ==============="
bright zos-workflows start workflow-key $wk
if [ $? -gt 0 ]
then
    exit $?
fi