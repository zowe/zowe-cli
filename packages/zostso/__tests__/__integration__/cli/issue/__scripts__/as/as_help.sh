#!/bin/bash
set -e

zowe zos-tso issue cmd -h
if [ $? -gt 0 ]
then
    exit $?
fi

zowe zos-tso issue command --help --response-format-json
exit $?
