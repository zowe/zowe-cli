#!/bin/bash
set -e

RESPONSE_KEY=`zowe zos-console issue command "D T" -k`

zowe zos-console collect sync-responses $RESPONSE_KEY
exit $?
