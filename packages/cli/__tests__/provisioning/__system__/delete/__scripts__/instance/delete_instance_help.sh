#!/bin/bash
set -e

zowe provisioning delete instance -h
if [ $? -gt 0 ]
then
    exit $?
fi

zowe provisioning delete instance --help --response-format-json
exit $?