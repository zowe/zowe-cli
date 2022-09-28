#!/bin/bash
set -e

zowe zos-jobs submit -h
if [ $? -gt 0 ]
then
    exit $?
fi

zowe zos-jobs submit --help --response-format-json
exit $?