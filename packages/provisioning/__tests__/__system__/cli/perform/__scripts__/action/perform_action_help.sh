#!/bin/bash
set -e

bright provisioning perf action -h
if [ $? -gt 0 ]
then
    exit $?
fi

bright provisioning perform action --help --response-format-json
exit $?