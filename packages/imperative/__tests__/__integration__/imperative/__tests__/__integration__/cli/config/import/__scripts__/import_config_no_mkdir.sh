#!/bin/bash

FORCE_COLOR=0

cd test

imperative-test-cli config import $1 $2
exit $?