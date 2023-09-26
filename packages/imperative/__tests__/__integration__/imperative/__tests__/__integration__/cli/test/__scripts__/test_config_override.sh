#!/bin/bash
set -e

mkdir -p test
cd test
imperative-test-cli test test-config-override --someKey $1
