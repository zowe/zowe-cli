#!/bin/bash
set -e

zowe zos-jobs -h
if [ $? -gt 0 ]
then
    exit $?
fi

zowe zos-jobs --help --response-format-json
exit $?