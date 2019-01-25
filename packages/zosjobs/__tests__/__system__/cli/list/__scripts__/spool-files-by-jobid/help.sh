#!/bin/bash
set -e

bright zos-jobs list spool-files-by-jobid -h
if [ $? -gt 0 ]
then
    exit $?
fi

bright zos-jobs list spool-files-by-jobid --help --response-format-json
exit $?