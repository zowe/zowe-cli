#!/bin/bash
set -e
echo "================ISSUING INVOKE WITH HELP==============="
cmd-cli invoke test-async-handler --help
echo "================ISSUING INVOKE HELP WITH RFJ==========="
cmd-cli invoke test-async-handler --help --rfj