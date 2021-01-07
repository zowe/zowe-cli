#!/bin/bash
wn=$1
set -e

echo "================Z/OS WORKFLOWS LIST ACTIVE-WORKFLOW-DETAILS LIST-STEPS AND STEP-SUMMARY-ONLY==============="
bright zos-workflows list active-workflow-details --workflow-name $wn --ls --sso
if [ $? -gt 0 ]
then
    exit $?
fi