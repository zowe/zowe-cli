#!/bin/bash
set -e

zowe provisioning list catalog-templates
if [ $? -gt 0 ]
then
    exit $?
fi

zowe pv ls ct --response-format-json
exit $?
