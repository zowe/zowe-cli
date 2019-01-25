#!/bin/bash
set -e

bright zos-console issue command "D T" --include-details --response-format-json
exit $?
