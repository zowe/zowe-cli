#!/bin/bash


cliColor=$1
cliDescription=$2
cliMoldType=$3

CMD_CLI_OPT_SWEETNESS="$4" cmd-cli profile mapping --color "$cliColor" --banana-description "$cliDescription" --mold-type "$cliMoldType"
CMDRC=$?
if [ $CMDRC -gt 0 ]
then
    echo "Profile mapping command failed!" 1>&2
    exit $CMDRC
fi
