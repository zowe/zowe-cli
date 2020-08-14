#!/bin/bash
set -e

zowe zos-jobs submit local-file -h
if [ $? -gt 0 ]
then
    exit $?
fi

zowe zos-jobs submit local-file --help --response-format-json
exit $?