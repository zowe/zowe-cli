#!/bin/bash
wkey=$1
set -e

echo "================Z/OS WORKFLOWS LIST ACTIVE-WORKFLOW-DETAILS==============="
bright zos-workflows list active-workflow-details --workflow-key $wkey
if [ $? -gt 0 ]
then
    exit $?
fi