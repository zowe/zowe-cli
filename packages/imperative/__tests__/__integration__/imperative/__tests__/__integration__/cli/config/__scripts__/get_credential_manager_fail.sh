#!/bin/bash

FORCE_COLOR=0

imperative-test-cli config get doesNotExist
exit $?
