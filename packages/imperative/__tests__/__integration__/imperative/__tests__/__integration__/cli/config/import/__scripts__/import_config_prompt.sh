#!/bin/bash

FORCE_COLOR=0

mkdir -p test
cd test

yes $promptAnswer | imperative-test-cli config import $1 $2
exit $?