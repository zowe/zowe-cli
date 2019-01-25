#!/bin/bash
set -e

bright provisioning list registry-instances
if [ $? -gt 0 ]
then
    exit $?
fi

bright pv ls ri --response-format-json
exit $?
