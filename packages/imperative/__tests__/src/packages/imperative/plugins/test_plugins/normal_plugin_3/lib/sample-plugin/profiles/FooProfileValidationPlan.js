"use strict";
// you can implement the validation plan as a Typescript class
// or any other way that allows us to  do: new (require("your profile validation plan module file name"))
class FooProfileValidationPlan {
    get tasks() {
        return [{
                name: "Check the size of the Foo",
                description: "The size of the Foo should be manageable",
                taskFunction: (profile, done) => {
                    let outcome;
                    let description;
                    if (profile.size === "small") {
                        outcome = "OK";
                        description = "We will be alright";
                    }
                    else if (profile.size === "medium") {
                        outcome = "Warning";
                        description = "This will take some effort to fix";
                    }
                    else if (profile.size === "large") {
                        outcome = "Failed";
                        description = "This is an insurmountable problem. Don't try to fix";
                    }
                    else {
                        outcome = "Failed";
                        description = "The size is unknown: " + profile.size;
                    }
                    const result = {
                        associatedEndpoints: [], outcome, resultDescription: description
                    };
                    done(result);
                },
                // only run these tasks if the size is small enough
                // if the size task fails, these will be skipped with a warning
                dependentTasks: [
                    {
                        name: "Repair in time",
                        description: "Can the foo be fixed before our deadline",
                        taskFunction: (profile, done) => {
                            const daysToDeadline = 100;
                            let outcome;
                            let description;
                            if (profile.duration <= daysToDeadline) {
                                outcome = "OK";
                                description = "We can complete on time.";
                            }
                            else if (profile.duration > daysToDeadline && profile.duration <= (daysToDeadline + 20)) {
                                outcome = "Warning";
                                description = "We will lose money, but should keep the customer";
                            }
                            else {
                                outcome = "Failed";
                                description = "We are out of business";
                            }
                            const result = {
                                associatedEndpoints: [], outcome, resultDescription: description
                            };
                            done(result);
                        }
                    }
                ]
            }];
    }
    get failureSuggestions() {
        return "You should have contracted with one of our competitors";
    }
}
module.exports = FooProfileValidationPlan;
//# sourceMappingURL=FooProfileValidationPlan.js.map