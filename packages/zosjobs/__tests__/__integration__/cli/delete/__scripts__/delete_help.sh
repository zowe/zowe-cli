#!/bin/bash

zowe zos-jobs delete -h
if [ $? -gt 0 ]
then
    exit $?
fi

zowe zos-jobs delete --help --response-format-json
exit $?
