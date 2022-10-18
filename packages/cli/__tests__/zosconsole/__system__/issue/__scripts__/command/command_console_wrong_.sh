#!/bin/bash
set -e

zowe zos-console issue command "D T" --cn 123@CA.COM
exit $?
