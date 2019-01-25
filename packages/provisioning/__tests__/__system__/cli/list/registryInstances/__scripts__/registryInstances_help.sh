#!/bin/bash
set -e

bright provisioning list registry-instances -h
if [ $? -gt 0 ]
then
    exit $?
fi

bright pv ls ri --help --response-format-json
exit $?
