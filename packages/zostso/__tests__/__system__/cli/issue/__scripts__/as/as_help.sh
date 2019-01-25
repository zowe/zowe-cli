#!/bin/bash
set -e

bright zos-tso issue cmd -h
if [ $? -gt 0 ]
then
    exit $?
fi

bright zos-tso issue command --help --response-format-json
exit $?
