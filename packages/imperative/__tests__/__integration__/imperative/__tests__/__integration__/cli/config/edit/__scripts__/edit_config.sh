#!/bin/bash

if [ -n "$IMPERATIVE_TEST_CLI_OPT_EDITOR" ]; then
    # A user-supplied editor triggers a trust prompt; answer it
    echo "y" | imperative-test-cli config edit
else
    imperative-test-cli config edit
fi
exit $?
