#!/bin/bash
set -e

bright provisioning list catalog-templates
if [ $? -gt 0 ]
then
    exit $?
fi

bright pv ls ct --response-format-json
exit $?
