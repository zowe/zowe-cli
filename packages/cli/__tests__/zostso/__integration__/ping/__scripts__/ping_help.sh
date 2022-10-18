#!/bin/bash
set -e

zowe zos-tso ping -h
if [ $? -gt 0 ]
then
    exit $?
fi

zowe zos-tso ping --help --response-format-json
exit $?