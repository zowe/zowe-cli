#!/bin/bash
set -e

zowe zos-tso send as -h
if [ $? -gt 0 ]
then
    exit $?
fi

zowe zos-tso send address-space --help --response-format-json
exit $?
