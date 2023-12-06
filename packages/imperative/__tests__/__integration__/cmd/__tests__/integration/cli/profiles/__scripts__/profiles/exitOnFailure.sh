#!/bin/bash

# function to exit if we encounter a bad return code
function exitOnFailure
{
    failureMsg=${1:?"First parm (failureMsg) is required."}
    actualExitCode=${2:?"Second parm (actualExitCode) is required."}
    goodExitCode=${3:-0}
    if [ $actualExitCode != $goodExitCode ]; then
        echo `basename $0`": $failureMsg" 1>&2
        exit $actualExitCode
    fi
}
