#!/bin/bash
echo "================ISSUING INVOKE WITH ERROR==============="
cmd-cli invoke test-async-handler --fail --fail-with-error
if [ $? -ne 1 ] 
then
    echo "The return code $? is not correct for the failure."
    exit $?
fi
echo "================ISSUING INVOKE ERROR WITH RFJ==========="
cmd-cli invoke test-async-handler --fail --fail-with-error --rfj
CMD_RC=$?
if [ $CMD_RC -ne 1 ] 
then
    echo "The return code $? is not correct for the failure."
fi
exit $CMD_RC