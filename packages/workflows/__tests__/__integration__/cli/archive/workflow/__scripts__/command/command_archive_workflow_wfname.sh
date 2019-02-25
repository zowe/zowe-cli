#!/bin/bash
wfname = $1
set -e

echo "================Z/OS WORKFLOWS ARCHIVE WORKFLOW WF NAME ==============="
zowe zos-workflows archive aw --wn $1
if [ $? -gt 0 ]
then
    exit $?
fi