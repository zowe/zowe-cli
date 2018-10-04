#!/bin/bash

zowe zos-jobs view all-spool-content --help
if [ $? -gt 0 ]
then
    exit $?
fi

zowe zos-jobs view asc -h --rfj
exit $?
