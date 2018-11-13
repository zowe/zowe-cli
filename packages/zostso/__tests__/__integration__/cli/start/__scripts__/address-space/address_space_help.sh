#!/bin/bash
set -e

zowe zos-tso st as -h
if [ $? -gt 0 ]
then
    exit $?
fi

zowe zos-tso start address-space --help --response-format-json
exit $?
