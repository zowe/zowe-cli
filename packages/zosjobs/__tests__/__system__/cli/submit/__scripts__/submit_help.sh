#!/bin/bash
set -e

bright zos-jobs submit -h
if [ $? -gt 0 ]
then
    exit $?
fi

bright zos-jobs submit --help --response-format-json
exit $?