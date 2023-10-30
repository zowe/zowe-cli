#!/bin/bash
echo "================ISSUING HELP NO OPTIONS==============="
cmd-cli --available-commands
if [ $? -gt 0 ] 
then
    exit $?
fi
