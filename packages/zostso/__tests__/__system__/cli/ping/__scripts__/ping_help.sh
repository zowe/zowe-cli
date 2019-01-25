#!/bin/bash
set -e

bright zos-tso ping -h
if [ $? -gt 0 ]
then
    exit $?
fi

bright zos-tso ping --help --response-format-json
exit $?