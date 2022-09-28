#!/bin/bash
set -e

zowe provisioning list instance-info -h
if [ $? -gt 0 ]
then
    exit $?
fi

zowe pv ls ii --help --response-format-json
exit $?
