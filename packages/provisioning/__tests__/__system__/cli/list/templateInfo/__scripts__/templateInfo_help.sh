#!/bin/bash
set -e

bright provisioning list template-info -h
if [ $? -gt 0 ]
then
    exit $?
fi

bright pv ls ti --help --response-format-json
exit $?
