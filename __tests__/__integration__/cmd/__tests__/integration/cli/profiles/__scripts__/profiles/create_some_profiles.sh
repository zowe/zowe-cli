#!/bin/bash
# First create a banana profile 
cmd-cli profiles create banana-profile "test_banana" --color "green"
CMDRC=$?
if [ $CMDRC -gt 0 ] 
then
    echo "Creating a test_banana profile of type banana failed!" 1>&2
    exit $CMDRC
fi

# Next create a strawberry profile with the same name as the banana profile
# This should cause the defaults of both types to be the same profile name
cmd-cli profiles create strawberry-profile "test_banana" --amount 1000
CMDRC=$?
if [ $CMDRC -gt 0 ] 
then
    echo "Creating a test_banana profile of type strawberry failed!" 1>&2
    exit $CMDRC
fi

# Next create a strawberry profile with the same name as the banana profile
cmd-cli profiles create strawberry-profile "test_strawberry" --amount 1000
CMDRC=$?
if [ $CMDRC -gt 0 ] 
then
    echo "Creating a test_strawberry profile failed!" 1>&2
    exit $CMDRC
fi

# Next create a kiwi profile with kiwiSecret not defined
cmd-cli profiles create kiwi-profile "test_kiwi" --amount 1000
CMDRC=$?
if [ $CMDRC -gt 0 ] 
then
    echo "Creating a test_kiwi profile failed!" 1>&2
    exit $CMDRC
fi
