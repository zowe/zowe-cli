#!/bin/bash
cmd-cli respond with-error-messages --format-string "I'm sorry, %s. I'm afraid I can't %s" --format-values "Dave" "do that." 
exit $?