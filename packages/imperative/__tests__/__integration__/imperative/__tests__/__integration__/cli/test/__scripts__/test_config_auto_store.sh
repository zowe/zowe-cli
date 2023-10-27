#!/bin/bash
set -e

mkdir -p test
cd test
echo $1 | imperative-test-cli test test-config-auto-store
