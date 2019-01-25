#!/bin/bash
set -e

bright zos-console issue command "D T" --key-only --response-format-json
exit $?
