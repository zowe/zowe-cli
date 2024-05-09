#!/bin/bash
echo "===================FAIL WITH IMPERATIVE ERROR============================"
cmd-cli invoke test-async-handler --fail
if [ $? -ne 1 ]
then
    echo "Fail with imperative error did NOT return the correct exit code. Code returned: $?"
    exit $?
fi
echo "===================FAIL WITH IMPERATIVE ERROR RFJ========================"
cmd-cli invoke test-async-handler --fail --rfj
CMD_RC=$?
if [ $CMD_RC -ne 1 ]
then
    echo "Fail with imperative error did NOT return the correct exit code. Code returned: $?"
    exit $?
fi
exit $CMD_RC