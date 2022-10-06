#!/bin/bash
# should get a syntax error
zowe zos-jobs submit data-set "DATA.SET" --wait-for-active --vasc
exit $?
