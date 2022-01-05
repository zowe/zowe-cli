#!/bin/bash
set -e

echo "================Z/OS WORKFLOWS START WORKFLOW EMPTY ==============="
zowe zos-workflows start workflow-full
if [ $? -gt 0 ]
then
    exit $?
fi