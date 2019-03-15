#!/bin/bash
wk=$1
wn=$2
set -e

echo "================Z/OS WORKFLOWS LIST ACTIVE-WORKFLOW-DETAILS NO WK==============="
bright zos-workflows list active-workflow-details --workflow-key $wk --workflow-name $wn
if [ $? -gt 0 ]
then
    exit $?
fi