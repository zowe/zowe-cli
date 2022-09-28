#!/bin/bash
set -e

zowe zos-jobs submit uss-file -h
if [ $? -gt 0 ]
then
    exit $?
fi

zowe zos-jobs submit uss-file --help --response-format-json
exit $?