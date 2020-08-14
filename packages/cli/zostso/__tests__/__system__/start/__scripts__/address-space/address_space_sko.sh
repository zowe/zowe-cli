#!/bin/bash
set -e

# Start address space, if the command was successful, servlet key will be received
zowe tso start as --sko

exit $?
