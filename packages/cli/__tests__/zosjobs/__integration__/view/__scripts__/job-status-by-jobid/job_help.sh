#!/bin/bash
set -e

zowe zos-jobs view job-status-by-jobid -h
if [ $? -gt 0 ]
then
    exit $?
fi

zowe zos-jobs view job-status-by-jobid --help --response-format-json
exit $?