#!/bin/bash
set -e

zowe provisioning list instance-info $1
if [ $? -gt 0 ]
then
    exit $?
fi

zowe pv ls ii $1 --response-format-json
exit $?
