#!/bin/bash
set -e

zowe provisioning list instance-variables -h
if [ $? -gt 0 ]
then
    exit $?
fi

zowe pv ls iv --help --response-format-json
exit $?
