#!/bin/bash
set -e

zowe zos-console collect sync-responses --host fakehost --user fakeuser --pw fakepass
exit $?
