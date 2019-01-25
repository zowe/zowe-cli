#!/bin/bash
set -e

bright zos-tso ping as -h
if [ $? -gt 0 ]
then
    exit $?
fi

bright zos-tso ping address-space --help --response-format-json
exit $?
