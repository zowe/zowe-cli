import { AbstractSession, Session, Imperative } from "@brightside/imperative";
import { ZosmfRestClient } from "../../../rest";
import { IArchivedWorkflow } from "../../src/api/doc/IArchivedWorkflow";
import { ArchiveWorkflow } from "../../";
import { WorkflowConstants } from "../../src/api/WorkflowConstants";

const session: AbstractSession = new Session({
    user: "usr",
    password: "password",
    hostname: "host.com",
    port: 443,
    type: "basic",
    rejectUnauthorized: false
});
const workflowKeyConst: string = "0123-456789-abc-def";

describe("Archive workflow unit tests - successful scenarios", () => {
    it("Successful archive", async ()=>{
        (ZosmfRestClient.postExpectJSON as any) = jest.fn<string>(() => {
            return new Promise((resolve)=>{
                Imperative.console.info("Using mocked function");
                process.nextTick(()=>{
                    const promiseOutput: IArchivedWorkflow = {
                        workflowKey: workflowKeyConst
                    };

                    resolve(promiseOutput);
                });
            });
        });
        const response = await ArchiveWorkflow.archiveWorfklowByKey(session, workflowKeyConst, WorkflowConstants.ZOSMF_VERSION);
        const expected: IArchivedWorkflow = {
            workflowKey: workflowKeyConst
        };

        expect(response).toEqual(expected);
        expect((ZosmfRestClient.postExpectJSON as any)).toHaveBeenCalledTimes(1);
        expect((ZosmfRestClient.postExpectJSON as any)).toHaveBeenCalledWith(session, workflowKeyConst, WorkflowConstants.ZOSMF_VERSION);
    });
});
