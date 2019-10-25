#!/bin/bash
dsn=$1
set -e

zowe zos-files list am "$dsn"
if [ $? -gt 0 ]
then
    exit $?
fi