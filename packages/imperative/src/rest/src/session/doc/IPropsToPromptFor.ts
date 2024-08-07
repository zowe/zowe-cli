import { ISession } from "../../..";

export interface IPropsToPromptFor <SessCfgType extends ISession=ISession> {
    name: keyof SessCfgType & string,
    secure?: boolean,
    description?: string,
    isGivenValueValid?: (givenValue: string) => boolean
}