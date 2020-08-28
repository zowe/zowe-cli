#!/bin/bash
set -e

SERVLET_KEY=`zowe tso start as | grep -oP "(?<=: ).*"`

zowe zos-tso stop address-space ${SERVLET_KEY}
exit $?