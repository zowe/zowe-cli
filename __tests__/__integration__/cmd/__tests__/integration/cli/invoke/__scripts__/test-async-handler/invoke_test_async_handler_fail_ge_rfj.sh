cmd-cli invoke test-async-handler --fail-with-error --rfj
CMD_RC=$?
if [ $CMD_RC -ne 1 ]
then
    echo "Fail with generic error did NOT return the correct exit code. Code returned: $?"
    exit $?
fi
exit $CMD_RC