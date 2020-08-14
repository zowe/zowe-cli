#!/bin/bash
path=$1
set -e

echo "================Z/OS WORKFLOWS LIST DEFINITION-FILE-DETAILS==========="

zowe wf list definition-file-details $path --rfj
if [ $? -gt 0 ]
then
    exit $?
fi