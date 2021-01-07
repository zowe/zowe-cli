#!/bin/bash
set -e

zowe provisioning prov template -h
if [ $? -gt 0 ]
then
    exit $?
fi

zowe provisioning prov template --help --response-format-json
exit $?