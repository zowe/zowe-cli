#!/bin/bash

# Run a command that needs credentials without anything on stdin,
# so any attempt to prompt for credentials shows up in the output.
zowe zosmf check status < /dev/null
exit $?
