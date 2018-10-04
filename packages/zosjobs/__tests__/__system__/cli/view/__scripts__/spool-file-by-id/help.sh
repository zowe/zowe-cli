#!/bin/bash
set -e

zowe zos-jobs view spool-file-by-id -h
if [ $? -gt 0 ]
then
    exit $?
fi

zowe zos-jobs view sfbi --help --response-format-json
exit $?