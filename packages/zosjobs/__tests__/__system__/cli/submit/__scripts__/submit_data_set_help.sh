#!/bin/bash
set -e

bright zos-jobs submit data-set -h
if [ $? -gt 0 ]
then
    exit $?
fi

bright zos-jobs submit data-set --help --response-format-json
exit $?