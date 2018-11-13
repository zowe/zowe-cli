#!/bin/bash
set -e

zowe provisioning list registry-instances -h
if [ $? -gt 0 ]
then
    exit $?
fi

zowe pv ls ri --help --response-format-json
exit $?
