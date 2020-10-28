#!/bin/bash
set -e

zowe zos-uss issue ssh -h
if [ $? -gt 0 ]
then
    exit $?
fi

zowe zos-uss issue ssh --help --response-format-json
exit $?