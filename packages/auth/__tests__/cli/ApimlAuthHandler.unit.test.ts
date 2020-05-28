import ApimlAuthHandler from "../../src/cli/ApimlAuthHandler";
import { SessConstants } from "@zowe/imperative";
import { ZosmfSession } from "../../../zosmf";
import { Login, Logout } from "../..";

describe("ApimlAuthHandler", () => {
    it("should not have changed", () => {
        const mockCreateZosmfSession = jest.fn();
        const mockApimlLogin = jest.fn();
        const mockApimlLogout = jest.fn();

        ZosmfSession.createSessCfgFromArgs = mockCreateZosmfSession;
        Login.apimlLogin = mockApimlLogin;
        Logout.apimlLogout = mockApimlLogout;

        const handler: any = new ApimlAuthHandler();
        expect(handler.mProfileType).toBe("base");
        expect(handler.mDefaultTokenType).toBe(SessConstants.TOKEN_TYPE_APIML);

        handler.createSessCfgFromArgs();
        expect(mockCreateZosmfSession).toHaveBeenCalledTimes(1);

        handler.doLogin();
        expect(mockApimlLogin).toHaveBeenCalledTimes(1);

        handler.doLogout();
        expect(mockApimlLogout).toHaveBeenCalledTimes(1);
    });
});
