jest.mock("child_process")
import Mock = jest.Mock;

import { resolve } from "path";
import { execSync } from "child_process";

it ("should call the start file and get a response", () => {

    const fn = execSync as Mock<typeof execSync>;
    fn.mockImplementation((...args: any[]) => {
        return Buffer.from("started");
    });

    const resp = require(resolve(__dirname, '../../packages/zowe-start-daemon'));
    expect(resp).toMatchSnapshot();
});
