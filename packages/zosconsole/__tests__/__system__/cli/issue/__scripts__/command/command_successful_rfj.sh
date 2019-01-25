#!/bin/bash
set -e

bright zos-console issue command "D IPLINFO" --rfj
exit $?
