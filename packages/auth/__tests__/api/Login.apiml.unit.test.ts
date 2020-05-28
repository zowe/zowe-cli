import { Login } from "../../src/api/Login";
import { ZosmfRestClient } from "../../../rest";
import { ImperativeError } from "@zowe/imperative";

const returnEmpty = async () => {
    return;
};
const mockErrorText = "Fake error for Auth Login APIML unit tests";
const throwImperativeError = async () => {
    throw new ImperativeError({msg: mockErrorText});
};
const fakeSession: any = {
    ISession: {
        tokenValue: "fakeToken"
    }
};

describe("Auth Login APIML unit tests", () => {
    describe("Positive tests", () => {
        it("should allow users to call apimlLogin with correct parameters", async () => {
            ZosmfRestClient.prototype.request = jest.fn(returnEmpty);
            await Login.apimlLogin(fakeSession);
        });
    });

    describe("Error handling tests - async/await", () => {
        it("should be able to catch errors from apimlLogin with async/await syntax", async () => {
            ZosmfRestClient.prototype.request = jest.fn(throwImperativeError);
            let caughtError;
            try {
                await Login.apimlLogin(fakeSession);
            } catch (error) {
                caughtError = error;
            }
            expect(caughtError).toBeDefined();
            expect(caughtError instanceof ImperativeError).toEqual(true);
            expect(caughtError.message).toEqual(mockErrorText);
        });
    });

    describe("Error handling tests - Promise catch() syntax", () => {
        it("should be able to catch errors from apimlLogin with Promise.catch() syntax", (done: any) => {
            ZosmfRestClient.prototype.request = jest.fn(throwImperativeError);
            Login.apimlLogin(fakeSession).then(() => {
                expect(".catch() should have been called").toEqual("test failed");
            }).catch((err) => {
                expect(err).toBeDefined();
                expect(err instanceof ImperativeError).toEqual(true);
                expect(err.message).toEqual(mockErrorText);
                done();
            });
        });
    });

    describe("Parameter validation", () => {
        it("should reject calls to apimlLogin that omit session", async () => {
            ZosmfRestClient.prototype.request = jest.fn(throwImperativeError);
            let caughtError;
            try {
                await Login.apimlLogin(null);
            } catch (error) {
                caughtError = error;
            }
            expect(caughtError).toBeDefined();
            expect(caughtError instanceof ImperativeError).toEqual(true);
            expect(caughtError.message).toContain("session");
        });
    });
});
