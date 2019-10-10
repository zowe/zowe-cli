#!/bin/bash
zowe zos-jobs submit stdin --wait-for-active --directory "./syntaxerr"
exit $?
