import { IProfileTypeConfiguration } from "../../../..";

const mockSchema: IProfileTypeConfiguration = {
    type: "test-type",
    schema: {
        title: "test-type",
        description: "A test type profile",
        type: "object",
        required: [],
        properties: {
            host: {
                type: "string",
                secure: false
            }
        }
    }
};

export default mockSchema;