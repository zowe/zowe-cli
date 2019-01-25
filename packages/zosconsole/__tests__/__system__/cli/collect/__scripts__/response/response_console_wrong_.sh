#!/bin/bash
set -e

bright zos-console collect sync-responses C1234567 --cn 123@CA.COM
exit $?
