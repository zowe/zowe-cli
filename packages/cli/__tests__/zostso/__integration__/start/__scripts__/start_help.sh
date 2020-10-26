#!/bin/bash
set -e

zowe zos-tso st -h
if [ $? -gt 0 ]
then
    exit $?
fi

zowe zos-tso start --help --response-format-json
exit $?
