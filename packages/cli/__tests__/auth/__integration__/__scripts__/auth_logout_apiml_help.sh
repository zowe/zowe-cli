#!/bin/bash
set -e

zowe auth logout apiml --help
if [ $? -gt 0 ]
then
    exit $?
fi

zowe auth logout apiml --help --response-format-json
exit $?