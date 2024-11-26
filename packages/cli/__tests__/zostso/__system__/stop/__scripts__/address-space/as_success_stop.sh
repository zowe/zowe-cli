#!/bin/bash
set -e

SERVLET_KEY=`zowe tso start as | awk -F': ' '{print $2}' | sed '1p;d'`

zowe zos-tso stop address-space ${SERVLET_KEY}
exit $?