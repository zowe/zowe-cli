#!/bin/bash
set -e

bright provisioning list instance-variables $1
if [ $? -gt 0 ]
then
    exit $?
fi

bright pv ls iv $1 --response-format-json
exit $?
