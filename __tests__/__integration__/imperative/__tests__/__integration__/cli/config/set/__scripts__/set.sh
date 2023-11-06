#!/bin/bash

FORCE_COLOR=0

mkdir -p test
cd test
imperative-test-cli config set $1 $2 $3
exit $?