#!/bin/bash
set -e

bright zos-tso stop -h
if [ $? -gt 0 ]
then
    exit $?
fi

bright zos-tso stop --help --response-format-json
exit $?