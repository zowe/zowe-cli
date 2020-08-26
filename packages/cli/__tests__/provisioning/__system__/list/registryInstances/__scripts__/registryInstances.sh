#!/bin/bash
set -e

zowe provisioning list registry-instances
if [ $? -gt 0 ]
then
    exit $?
fi

zowe pv ls ri --response-format-json
exit $?
