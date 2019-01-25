#!/bin/bash
set -e

bright zos-jobs list jobs -h
if [ $? -gt 0 ]
then
    exit $?
fi

bright zos-jobs list jobs --help --response-format-json
exit $?