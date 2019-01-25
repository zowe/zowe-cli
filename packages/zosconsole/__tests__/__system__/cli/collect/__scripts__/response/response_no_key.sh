#!/bin/bash
set -e

bright zos-console collect sync-responses
exit $?
