#!/bin/bash

FORCE_COLOR=0

mkdir -p test
cd test
echo "anotherFakeValue" | imperative-test-cli config secure $1
exit $?
