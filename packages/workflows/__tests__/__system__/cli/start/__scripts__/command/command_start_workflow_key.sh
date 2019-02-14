#!/bin/bash
wk=$1
wait=$2
set -e

echo "================Z/OS WORKFLOWS START WORKFLOW-KEY ==============="
bright zos-workflows start workflow-with-workflow-key $wk $wait
if [ $? -gt 0 ]
then
    exit $?
fi