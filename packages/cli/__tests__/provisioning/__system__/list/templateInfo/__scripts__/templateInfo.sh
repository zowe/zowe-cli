#!/bin/bash
set -e

zowe provisioning list template-info $1
if [ $? -gt 0 ]
then
    exit $?
fi

zowe pv ls ti $1 --response-format-json
exit $?
