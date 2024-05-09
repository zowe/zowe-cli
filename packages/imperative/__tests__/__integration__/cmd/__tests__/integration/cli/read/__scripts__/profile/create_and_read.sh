#!/bin/bash
set -e
OUTPUT=$(cmd-cli profiles create insecure "test_insecure" --info "some info" --secret "not so secret info")
cmd-cli read profile
