#!/bin/bash
set -e

bright zos-tso issue -h
if [ $? -gt 0 ]
then
    exit $?
fi

bright zos-tso issue --help --response-format-json
exit $?
