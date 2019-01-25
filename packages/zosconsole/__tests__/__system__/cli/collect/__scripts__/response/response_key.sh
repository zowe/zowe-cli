#!/bin/bash
set -e

RESPONSE_KEY=`bright zos-console issue command "D T" -k`

bright zos-console collect sync-responses $RESPONSE_KEY
exit $?
