#!/bin/bash
# pass the JCL as stdin to this script
cat "$1" | zowe zos-jobs submit stdin --wfo
exit $?
