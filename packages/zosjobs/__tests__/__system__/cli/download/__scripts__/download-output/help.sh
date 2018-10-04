#!/bin/bash

zowe zos-jobs download output -h
if [ $? -gt 0 ]
then
    exit $?
fi

zowe zos-jobs download output --help --response-format-json
exit $?
