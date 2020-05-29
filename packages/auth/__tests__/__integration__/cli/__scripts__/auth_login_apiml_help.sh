#!/bin/bash
set -e

zowe auth login apiml --help
if [ $? -gt 0 ]
then
    exit $?
fi

zowe auth login apiml --help --response-format-json
exit $?