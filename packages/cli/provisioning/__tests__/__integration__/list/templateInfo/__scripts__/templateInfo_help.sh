#!/bin/bash
set -e

zowe provisioning list template-info -h
if [ $? -gt 0 ]
then
    exit $?
fi

zowe pv ls ti --help --response-format-json
exit $?
