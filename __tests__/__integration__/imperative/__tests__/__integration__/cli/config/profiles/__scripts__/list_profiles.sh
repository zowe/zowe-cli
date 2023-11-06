#!/bin/bash

FORCE_COLOR=0

mkdir -p test
cd test
imperative-test-cli config profiles $1
exit $?