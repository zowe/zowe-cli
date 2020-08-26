#!/bin/bash
set -e

zowe zos-tso send -h
if [ $? -gt 0 ]
then
    exit $?
fi

zowe zos-tso send --help --response-format-json
exit $?
