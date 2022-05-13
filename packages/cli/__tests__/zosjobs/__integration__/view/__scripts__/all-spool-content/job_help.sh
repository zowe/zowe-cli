#!/bin/bash
set -e

zowe zos-jobs view all-spool-content -h
if [ $? -gt 0 ]
then
    exit $?
fi

zowe zos-jobs view all-spool-content --help --response-format-json
exit $?