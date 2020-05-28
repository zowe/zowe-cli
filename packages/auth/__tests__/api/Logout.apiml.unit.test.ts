import { Logout } from "../../src/api/Logout";
import { ZosmfRestClient } from "../../../rest";
import { ImperativeError, RestConstants } from "@zowe/imperative";

const returnEmpty = async () => {
    return;
};
const goodResponse: any = {
    statusCode: RestConstants.HTTP_STATUS_204
};
const mockErrorText = "Fake error for Auth Logout APIML unit tests";
const throwImperativeError = async () => {
    throw new ImperativeError({msg: mockErrorText});
};
const fakeSession: any = {
    ISession: {
        tokenValue: "fakeToken"
    }
};

describe("Auth Logout APIML unit tests", () => {
    describe("Positive tests", () => {
        it("should allow users to call apimlLogout with correct parameters", async () => {
            ZosmfRestClient.prototype.request = jest.fn(returnEmpty);
            (ZosmfRestClient.prototype as any).mResponse = goodResponse;
            await Logout.apimlLogout(fakeSession);
        });
    });

    describe("Error handling tests - async/await", () => {
        it("should be able to catch errors from apimlLogout with async/await syntax", async () => {
            ZosmfRestClient.prototype.request = jest.fn(throwImperativeError);
            let caughtError;
            try {
                await Logout.apimlLogout(fakeSession);
            } catch (error) {
                caughtError = error;
            }
            expect(caughtError).toBeDefined();
            expect(caughtError instanceof ImperativeError).toEqual(true);
            expect(caughtError.message).toEqual(mockErrorText);
        });
    });

    describe("Error handling tests - Promise catch() syntax", () => {
        it("should be able to catch errors from apimlLogout with Promise.catch() syntax", (done: any) => {
            ZosmfRestClient.prototype.request = jest.fn(throwImperativeError);
            Logout.apimlLogout(fakeSession).then(() => {
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
        it("should reject calls to apimlLogout that omit session", async () => {
            ZosmfRestClient.prototype.request = jest.fn(throwImperativeError);
            let caughtError;
            try {
                await Logout.apimlLogout(null);
            } catch (error) {
                caughtError = error;
            }
            expect(caughtError).toBeDefined();
            expect(caughtError instanceof ImperativeError).toEqual(true);
            expect(caughtError.message).toContain("session");
        });

        it("should reject calls to apimlLogout that omit token value in session", async () => {
            ZosmfRestClient.prototype.request = jest.fn(throwImperativeError);
            let caughtError;
            try {
                await Logout.apimlLogout({} as any);
            } catch (error) {
                caughtError = error;
            }
            expect(caughtError).toBeDefined();
            expect(caughtError instanceof ImperativeError).toEqual(true);
            expect(caughtError.message).toContain("token");
        });
    });
});
