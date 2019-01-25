#!/bin/bash
set -e

bright provisioning list instance-info $1
if [ $? -gt 0 ]
then
    exit $?
fi

bright pv ls ii $1 --response-format-json
exit $?
