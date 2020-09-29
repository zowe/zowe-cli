jest.mock("child_process")
import Mock = jest.Mock;

import { resolve } from "path";
import { execSync } from "child_process";

it ("should call the stop file and get a response", () => {

    const fn = execSync as Mock<typeof execSync>;
    fn.mockImplementation((...args: any[]) => {
        return Buffer.from("stopped");
    });

    const resp = require(resolve(__dirname, '../../packages/zowe-stop-daemon'));
    expect(resp).toMatchSnapshot();
});
