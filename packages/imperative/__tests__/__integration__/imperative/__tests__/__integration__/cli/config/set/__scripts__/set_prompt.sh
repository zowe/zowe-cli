#!/bin/bash

FORCE_COLOR=0

mkdir -p test
cd test
echo "some_fake_information_prompted" | imperative-test-cli config set $1 $2
exit $?