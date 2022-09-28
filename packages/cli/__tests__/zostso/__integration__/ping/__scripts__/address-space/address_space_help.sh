#!/bin/bash
set -e

zowe zos-tso ping as -h
if [ $? -gt 0 ]
then
    exit $?
fi

zowe zos-tso ping address-space --help --response-format-json
exit $?
