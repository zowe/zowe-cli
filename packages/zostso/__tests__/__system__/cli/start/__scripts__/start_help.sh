#!/bin/bash
set -e

bright zos-tso st -h
if [ $? -gt 0 ]
then
    exit $?
fi

bright zos-tso start --help --response-format-json
exit $?
