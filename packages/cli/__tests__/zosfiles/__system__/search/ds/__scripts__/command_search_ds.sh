#!/bin/bash
set -e

DSN=$1
STERM=$2
shift 2

zowe zos-files search ds "$DSN" "$STERM" $@
if [ $? -gt 0 ]
then
    exit $?
fi
