#!/bin/bash
set -e

bright zos-jobs view job-status-by-jobid -h
if [ $? -gt 0 ]
then
    exit $?
fi

bright zos-jobs view job-status-by-jobid --help --response-format-json
exit $?