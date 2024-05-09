#!/bin/bash

FORCE_COLOR=0

mkdir -p test
cd test
imperative-test-cli config init $1
exit $?
