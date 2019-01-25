#!/bin/bash
set -e

SERVLET_KEY=`bright tso start as | cut -d ' ' -f 8`

bright zos-tso stop address-space ${SERVLET_KEY}
exit $?