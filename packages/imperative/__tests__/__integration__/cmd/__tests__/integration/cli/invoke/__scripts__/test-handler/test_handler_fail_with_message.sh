#!/bin/bash
cmd-cli invoke test-handler --fail-with-message "Failure message from option!"
exit $?