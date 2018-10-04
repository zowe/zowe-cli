#!/bin/bash
set -e

zowe provisioning perf action -h
if [ $? -gt 0 ]
then
    exit $?
fi

zowe provisioning perform action --help --response-format-json
exit $?