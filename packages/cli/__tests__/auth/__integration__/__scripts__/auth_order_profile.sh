#!/bin/bash

if [ $# -eq 0 ]; then
    zowe zosmf check status --show-inputs-only
else
    zowe "$@"
fi
exit $?
