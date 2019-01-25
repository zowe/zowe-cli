#!/bin/bash
set -e

bright zos-jobs -h
if [ $? -gt 0 ]
then
    exit $?
fi

bright zos-jobs --help --response-format-json
exit $?