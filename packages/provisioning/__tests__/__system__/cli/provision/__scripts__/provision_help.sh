#!/bin/bash
set -e

bright provisioning prov -h
if [ $? -gt 0 ]
then
    exit $?
fi

bright provisioning provision --help --response-format-json
exit $?