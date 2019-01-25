#!/bin/bash
set -e

bright provisioning delete instance -h
if [ $? -gt 0 ]
then
    exit $?
fi

bright provisioning delete instance --help --response-format-json
exit $?