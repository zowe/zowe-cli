#!/bin/bash
set -e

CONSOLE_NAME="TEST9999"
RESPONSE_KEY=`zowe zos-console issue command "D T" -k -c ${CONSOLE_NAME}`

zowe zos-console collect sync-responses $RESPONSE_KEY --cn $CONSOLE_NAME
exit $?
