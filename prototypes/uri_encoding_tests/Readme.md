This directory contains manual and semi-automated tests that can be helpful in testing and debugging the encoding of URI paths in REST requests to z/OSMF and API-ML.

The following IBM webpage describes the special characters that can be placed in data sets and files.

[Special characters for z/OS data set names and USS file names](https://www.ibm.com/docs/en/zos/3.1.0?topic=pages-zos-data-set-unix-file-naming-conventions)

In each of the files within this directory, individual and company identifiers were replaced with generic identifiers, so the files will require some editing before they can be used.

## zowe.config_sample.json

The Zowe configuration contains a profile for connecting to z/OSMF and a profile for connecting to API-ML. The profile names are used by the sample manual commands and in the `encode_uri_test.ps1` test script.

## encode_uri_cmds.txt

This file contains a collection of Zowe commands which can be used to manually test the Zowe client SDK's encoding of URI paths. The commands are intended to be used in a copy-and-paste fashion.

## encode_uri_test.ps1

This file is a semi-automated test script. The script iterates through every documented special character for USS filenames and puts each special character into a variety of USS commands which are run against both z/OSMF and API-ML. The script is interactive and relies on human inspection of the results of each test as it occurs. Even though the script is interactive, it is a good time-saver because of the number of characters, actions, and servers required to test every possibility.

The script only runs USS operations because USS file names permit a much larger set of special characters than z/OS data sets, making the combinations much more difficult to manage manually.

The script is written in PowerShell, so it must be run on Windows. The logic of this script could be rewritten in Bash to make it runnable on other systems. If a Bash script were written, it is possible that further logic could be added to fully automate the test and include it in the Zowe system test suite.

## hello_world_bpxbatch.jcl

This file is a simple JCL script used by the various tests.
