#!/bin/bash

baseUser=$1
basePass=$2

# First create a base profile
imperative-test-cli config init --prompt false
CMDRC=$?
if [ $CMDRC -gt 0 ]
then
    echo "Creating a test_base config failed!" 1>&2
    exit $CMDRC
fi

imperative-test-cli config set "profiles.base.properties.user" "$baseUser"
if [ $CMDRC -gt 0 ]
then
    echo "Setting user of config failed!" 1>&2
    exit $CMDRC
fi

imperative-test-cli config set "profiles.base.properties.password" "$basePass"
if [ $CMDRC -gt 0 ]
then
    echo "Setting password of config failed!" 1>&2
    exit $CMDRC
fi
