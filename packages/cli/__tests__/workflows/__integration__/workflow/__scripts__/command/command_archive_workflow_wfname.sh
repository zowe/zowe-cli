#!/bin/bash
set -e

echo "================Z/OS WORKFLOWS ARCHIVE WORKFLOW WF NAME ==============="
zowe zos-workflows archive aw --wn
if [ $? -gt 0 ]
then
    exit $?
fi