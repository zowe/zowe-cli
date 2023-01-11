#!/bin/bash

zowe zos-jobs modify -h
if [ $? -gt 0 ]
then
    exit $?
fi

zowe zos-jobs modify --help --response-format-json
exit $?
