#!/bin/bash

zowe zos-jobs cancel job -h
if [ $? -gt 0 ]
then
    exit $?
fi

zowe zos-jobs cancel job --help --response-format-json
exit $?
