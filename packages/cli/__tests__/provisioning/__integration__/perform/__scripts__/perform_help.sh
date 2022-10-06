#!/bin/bash
set -e

zowe provisioning perf -h
if [ $? -gt 0 ]
then
    exit $?
fi

zowe provisioning perform --help --response-format-json
exit $?