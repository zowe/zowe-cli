#!/bin/bash
set -e

echo "================Z/OS WORKFLOWS ARCHIVE WORKFLOW EMPTY ==============="
zowe zos-workflows archive aw
if [ $? -gt 0 ]
then
    exit $?
fi