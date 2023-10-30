#!/bin/bash

FORCE_COLOR=0

mkdir -p test
cd test
imperative-test-cli config update-schemas $1
exit $?