#!/bin/bash
set -e

bright zos-tso -h
if [ $? -gt 0 ]
then
    exit $?
fi

bright zos-tso --help --response-format-json
exit $?
