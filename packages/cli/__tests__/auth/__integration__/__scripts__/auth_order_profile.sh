#!/bin/bash

# Execute zowe command (defaults to zosmf check status if no args provided)
if [ $# -eq 0 ]; then
    zowe zosmf check status
else
    zowe "$@"
fi
exit $?
