#!/bin/bash
cmd-cli profiles create insecure "test_insecure" --info "some info" --secret "not so secret info"
CMDRC=$?
if [ $CMDRC -gt 0 ] 
then
    echo "Creating a profile of type 'insecure' failed!" 1>&2
    exit $CMDRC
fi

cmd-cli profiles list insecure --sc