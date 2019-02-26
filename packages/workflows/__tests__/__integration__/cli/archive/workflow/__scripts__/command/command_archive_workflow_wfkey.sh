#!/bin/bash
set -e

echo "================Z/OS WORKFLOWS ARCHIVE WORKFLOW BY KEY ==============="
zowe zos-workflows archive aw --wk
if [ $? -gt 0 ]
then
    exit $?
fi