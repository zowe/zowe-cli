#!/bin/bash
set -e

zowe zos-jobs view -h
if [ $? -gt 0 ]
then
    exit $?
fi

zowe zos-jobs view --help --response-format-json
exit $?