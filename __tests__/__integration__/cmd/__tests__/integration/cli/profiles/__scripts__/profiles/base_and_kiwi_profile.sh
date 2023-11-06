#!/bin/bash

baseAmount=$1
basePrice=$2
kiwiAmount=$3

# First create a base profile
cmd-cli profiles create base-profile "test_base" --amount $baseAmount --price $basePrice
CMDRC=$?
if [ $CMDRC -gt 0 ]
then
    echo "Creating a test_base profile of type base failed!" 1>&2
    exit $CMDRC
fi

# Next create a kiwi profile
cmd-cli profiles create kiwi-profile "test_kiwi" --amount $kiwiAmount --dd
CMDRC=$?
if [ $CMDRC -gt 0 ]
then
    echo "Creating a test_kiwi profile of type kiwi failed!" 1>&2
    exit $CMDRC
fi

cmd-cli profile mapping-base
CMDRC=$?
if [ $CMDRC -gt 0 ]
then
    echo "Profile mapping command failed!" 1>&2
    exit $CMDRC
fi
