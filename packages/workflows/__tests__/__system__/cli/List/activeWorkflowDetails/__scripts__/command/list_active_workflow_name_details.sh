#!/bin/bash
wname=$1
set -e

echo "================Z/OS WORKFLOWS LIST ACTIVE-WORKFLOW-DETAILS==============="
bright zos-workflows list active-workflow-details --workflow-name $wname
if [ $? -gt 0 ]
then
    exit $?
fi