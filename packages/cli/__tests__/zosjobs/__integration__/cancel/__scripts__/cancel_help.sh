#!/bin/bash

zowe zos-jobs cancel -h
if [ $? -gt 0 ]
then
    exit $?
fi

zowe zos-jobs cancel --help --response-format-json
exit $?
