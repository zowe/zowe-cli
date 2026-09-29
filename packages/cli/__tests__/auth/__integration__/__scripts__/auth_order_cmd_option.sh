#!/bin/bash

# Execute zosmf check status with comma-separated auth-order option containing spaces
zowe zosmf check status --auth-order "token, bearer" --host "example.com"
exit $?
