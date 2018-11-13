#!/bin/bash
set -e

zowe zos-jobs submit data-set -h
if [ $? -gt 0 ]
then
    exit $?
fi

zowe zos-jobs submit data-set --help --response-format-json
exit $?