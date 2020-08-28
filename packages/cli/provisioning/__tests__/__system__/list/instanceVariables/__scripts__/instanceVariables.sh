#!/bin/bash
set -e

zowe provisioning list instance-variables $1
if [ $? -gt 0 ]
then
    exit $?
fi

zowe pv ls iv $1 --response-format-json
exit $?
