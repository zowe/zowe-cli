#!/bin/bash
set -e

bright provisioning prov template -h
if [ $? -gt 0 ]
then
    exit $?
fi

bright provisioning prov template --help --response-format-json
exit $?