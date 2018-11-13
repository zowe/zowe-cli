#!/bin/bash
set -e

zowe zos-tso -h
if [ $? -gt 0 ]
then
    exit $?
fi

zowe zos-tso --help --response-format-json
exit $?
