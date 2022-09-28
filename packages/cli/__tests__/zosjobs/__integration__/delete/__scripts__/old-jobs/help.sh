#!/bin/bash

zowe zos-jobs delete old-jobs -h
if [ $? -gt 0 ]
then
    exit $?
fi

zowe zos-jobs delete old-jobs --help --response-format-json
exit $?
