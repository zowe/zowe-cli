#!/bin/bash

zowe zos-jobs delete job -h
if [ $? -gt 0 ]
then
    exit $?
fi

zowe zos-jobs delete job --help --response-format-json
exit $?
