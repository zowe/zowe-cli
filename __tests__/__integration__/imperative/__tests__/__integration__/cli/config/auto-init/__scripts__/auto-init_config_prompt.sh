#!/bin/bash
set -e

echo "fakeInput" | imperative-test-cli config auto-init $@
