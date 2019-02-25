#!/bin/bash
wfname = $1
wfkey = $2
set -e

echo "================Z/OS WORKFLOWS ARCHIVE WORKFLOW ==============="
zowe zos-workflows archive aw --wn $1 --wk $2
if [ $? -gt 0 ]
then
    exit $?
fi