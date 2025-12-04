This scrt folder contains prototypes that were created during the creation of the following design document.

[Design for generating SCRT reports for Zowe client plugins and extensions](https://docs.google.com/document/d/1Jv0l2GQs3n5PuWxhhevQM-ZNOQbX315MWXcWSaACb5Q/edit?usp=sharing)

The server_proto folder contains a draft implementation of an enhancement to the server-side REST API SDK.  Real FRS and REST API SDK functions are mocked out. However it does contain logic to process SCRT information. That logic can be exercised on a laptop by running the following command in the server_proto directory.

    .\gradlew :app:run
