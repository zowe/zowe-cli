#!/bin/bash
set -e

bright zos-tso send as -h
if [ $? -gt 0 ]
then
    exit $?
fi

bright zos-tso send address-space --help --response-format-json
exit $?
