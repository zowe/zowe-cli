#!/bin/bash

zowe zos-jobs modify job -h
if [ $? -gt 0 ]
then
    exit $?
fi

zowe zos-jobs modify job --help --response-format-json
exit $?
