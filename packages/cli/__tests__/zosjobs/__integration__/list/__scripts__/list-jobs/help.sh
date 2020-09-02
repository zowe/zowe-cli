#!/bin/bash
set -e

zowe zos-jobs list jobs -h
if [ $? -gt 0 ]
then
    exit $?
fi

zowe zos-jobs list jobs --help --response-format-json
exit $?