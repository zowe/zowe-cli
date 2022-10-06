#!/bin/bash
set -e

zowe zos-jobs list spool-files-by-jobid -h
if [ $? -gt 0 ]
then
    exit $?
fi

zowe zos-jobs list spool-files-by-jobid --help --response-format-json
exit $?