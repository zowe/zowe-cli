#!/bin/bash
set -e

bright zos-jobs view spool-file-by-id -h
if [ $? -gt 0 ]
then
    exit $?
fi

bright zos-jobs view sfbi --help --response-format-json
exit $?