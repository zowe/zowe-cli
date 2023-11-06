#!/bin/bash
imperative-test-cli test logging
CMD_RC=$?
if [ $CMD_RC -ne 0 ]
then
    echo "Help did not return the expected return code of 0. Return code: $CMD_RC"
fi 
exit $CMD_RC