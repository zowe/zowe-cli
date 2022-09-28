#!/bin/bash
set -e

zowe provisioning list catalog-templates -h
if [ $? -gt 0 ]
then
    exit $?
fi

zowe pv ls ct --help --response-format-json
exit $?
