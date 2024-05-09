#!/bin/bash

echo $1 | imperative-test-cli config convert-profiles
exit $?
