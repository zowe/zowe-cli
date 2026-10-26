#!/bin/bash

FORCE_COLOR=0

mkdir -p test
cd test

if [[ -z "$promptAnswer" ]]; then
    promptAnswer=y
fi

yes $promptAnswer | imperative-test-cli config import $1 $2
exit $?