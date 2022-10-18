#!/bin/bash
set -e

zowe zos-tso issue -h
if [ $? -gt 0 ]
then
    exit $?
fi

zowe zos-tso issue --help --response-format-json
exit $?
