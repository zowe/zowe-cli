#!/bin/bash
set -e

zowe config auto-init --help
if [ $? -gt 0 ]
then
    exit $?
fi

zowe config auto-init --help --response-format-json
exit $?
