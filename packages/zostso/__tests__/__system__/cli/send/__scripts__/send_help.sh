#!/bin/bash
set -e

bright zos-tso send -h
if [ $? -gt 0 ]
then
    exit $?
fi

bright zos-tso send --help --response-format-json
exit $?
