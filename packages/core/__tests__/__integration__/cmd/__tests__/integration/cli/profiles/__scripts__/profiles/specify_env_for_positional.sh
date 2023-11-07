#!/bin/bash

CMD_CLI_OPT_COLOR="$1" CMD_CLI_OPT_BANANA_DESCRIPTION="$2" CMD_CLI_OPT_MOLD_TYPE="$3" cmd-cli profile mapping-positional
CMDRC=$?
if [ $CMDRC -gt 0 ]
then
    echo "Profile mapping command failed!" 1>&2
    exit $CMDRC
fi
