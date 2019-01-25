#!/bin/bash
set -e

bright zos-jobs view -h
if [ $? -gt 0 ]
then
    exit $?
fi

bright zos-jobs view --help --response-format-json
exit $?