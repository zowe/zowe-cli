#!/bin/bash
set -e

bright provisioning list instance-variables -h
if [ $? -gt 0 ]
then
    exit $?
fi

bright pv ls iv --help --response-format-json
exit $?
