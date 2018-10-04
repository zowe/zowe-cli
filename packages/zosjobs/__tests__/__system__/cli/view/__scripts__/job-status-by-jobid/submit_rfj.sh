#!/bin/bash
zowe zos-jobs submit data-set "$1" --rfj
exit $?