#!/bin/bash
zowe zos-jobs submit local-file $1 --wait-for-active --directory "./syntaxerr"
exit $?
