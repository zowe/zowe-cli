#!/bin/bash
set -e

echo "================Z/OS WORKFLOWS LIST DEFINITION-FILE-DETAILS NO ARGUMENT==============="
zowe zos-workflows list definition-file-details
if [ $? -gt 0 ]
then
    exit $?
fi