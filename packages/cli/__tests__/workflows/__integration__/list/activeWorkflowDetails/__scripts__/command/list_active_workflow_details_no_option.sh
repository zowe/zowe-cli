#!/bin/bash
set -e

echo "================Z/OS WORKFLOWS LIST ACTIVE-WORKFLOW-DETAILS NO WK==============="
bright zos-workflows list active-workflow-details
if [ $? -gt 0 ]
then
    exit $?
fi