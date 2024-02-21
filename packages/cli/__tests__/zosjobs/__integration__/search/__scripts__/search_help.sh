#!/bin/bash
set -e

zowe zos-jobs search -h
if [ $? -gt 0 ]
then
    exit $?
fi

zowe zos-jobs search --help --response-format-json
exit $?