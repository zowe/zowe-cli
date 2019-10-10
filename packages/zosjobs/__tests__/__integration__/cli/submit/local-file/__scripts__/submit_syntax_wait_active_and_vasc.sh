#!/bin/bash
zowe zos-jobs submit local-file $1 --wait-for-active --vasc
exit $?
