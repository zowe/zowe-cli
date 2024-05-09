#!/bin/bash
cmd-cli respond with-mixed-responses --da '{"this": "is data"}' --mfr "Response message!" --efs "I don't %s, I don't %s... All I do is think of you." --efv "eat" "sleep" --lfs "Your %s were so preoccupied with whether or not they %s, they didn't stop to think if they %s!" --lfv "scientists" "could" "should"
exit $? 