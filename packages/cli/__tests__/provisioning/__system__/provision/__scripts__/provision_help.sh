#!/bin/bash
set -e

zowe provisioning prov -h
if [ $? -gt 0 ]
then
    exit $?
fi

zowe provisioning provision --help --response-format-json
exit $?