#!/bin/bash
set -e

bright provisioning list template-info $1
if [ $? -gt 0 ]
then
    exit $?
fi

bright pv ls ti $1 --response-format-json
exit $?
