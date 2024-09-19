#!/bin/bash
set -e

zowe zos-jobs search job -h
if [ $? -gt 0 ]
then
    exit $?
fi

zowe zos-jobs search job --help --response-format-json
exit $?