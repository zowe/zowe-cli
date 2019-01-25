#!/bin/bash
set -e

bright zos-console issue command "D T" --cn 123@CA.COM
exit $?
