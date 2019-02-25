#!/bin/bash
wfkey = $1
set -e

echo "================Z/OS WORKFLOWS ARCHIVE WORKFLOW BY KEY ==============="
zowe zos-workflows archive aw --wk $1
if [ $? -gt 0 ]
then
    exit $?
fi