#!/bin/bash
set -e

bright provisioning list instance-info -h
if [ $? -gt 0 ]
then
    exit $?
fi

bright pv ls ii --help --response-format-json
exit $?
