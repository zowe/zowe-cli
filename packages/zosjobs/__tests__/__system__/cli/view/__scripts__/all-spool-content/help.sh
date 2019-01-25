#!/bin/bash

bright zos-jobs view all-spool-content --help
if [ $? -gt 0 ]
then
    exit $?
fi

bright zos-jobs view asc -h --rfj
exit $?
