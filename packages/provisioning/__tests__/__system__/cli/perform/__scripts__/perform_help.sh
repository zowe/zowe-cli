#!/bin/bash
set -e

bright provisioning perf -h
if [ $? -gt 0 ]
then
    exit $?
fi

bright provisioning perform --help --response-format-json
exit $?