#!/bin/bash
set -e

zowe zos-tso stop -h
if [ $? -gt 0 ]
then
    exit $?
fi

zowe zos-tso stop --help --response-format-json
exit $?