#!/bin/bash
set -e

bright provisioning list catalog-templates -h
if [ $? -gt 0 ]
then
    exit $?
fi

bright pv ls ct --help --response-format-json
exit $?
