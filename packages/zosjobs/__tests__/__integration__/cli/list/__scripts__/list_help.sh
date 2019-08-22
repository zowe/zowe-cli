#!/bin/bash
set -e

zowe zos-jobs list -h
if [ $? -gt 0 ]
then
    exit $?
fi

zowe zos-jobs list --help --response-format-json
exit $?