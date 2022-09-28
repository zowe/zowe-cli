#!/bin/bash

zowe zos-jobs download -h
if [ $? -gt 0 ]
then
    exit $?
fi

zowe zos-jobs download --help --response-format-json
exit $?
