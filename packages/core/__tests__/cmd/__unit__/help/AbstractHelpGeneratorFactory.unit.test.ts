/*
* This program and the accompanying materials are made available under the terms of the
* Eclipse Public License v2.0 which accompanies this distribution, and is available at
* https://www.eclipse.org/legal/epl-v20.html
*
* SPDX-License-Identifier: EPL-2.0
*
* Copyright Contributors to the Zowe Project.
*
*/

import { TestHelpGeneratorFactory } from "./model/TestHelpGeneratorFactory";
import { InheritedHelpGenerator } from "./model/InheritedHelpGenerator";
import { ICommandDefinition, ImperativeError } from "../../../../src";

const SAMPLE_COMMAND: ICommandDefinition = {
    name: "banana",
    type: "command",
    description: "The banana command"
};

const SAMPLE_COMMAND_TREE: ICommandDefinition = {
    name: "fruits",
    type: "group",
    description: "The fruits",
    children: [SAMPLE_COMMAND]
};

describe("Abstract Help Generator Factory", () => {
    it("should be able to create an instance", () => {
        const factory = new TestHelpGeneratorFactory({
            rootCommandName: "fruits"
        });
        expect((factory as any).produceMarkdown).toBe(false);
        expect((factory as any).rootCommandName).toBe("fruits");
        expect((factory as any).primaryHighlightColor).toBe("yellow");
        expect(factory.getHelpGenerator).toBeDefined();
    });

    it("should be able to create an instance and indicate markdown", () => {
        const factory = new TestHelpGeneratorFactory({
            rootCommandName: "fruits",
            produceMarkdown: true
        });
        expect((factory as any).produceMarkdown).toBe(true);
        expect(factory.getHelpGenerator).toBeDefined();
    });

    it("should detect missing parameters", () => {
        let error;
        try {
            const factory = new TestHelpGeneratorFactory(undefined);
        } catch (e) {
            error = e;
        }
        expect(error).toBeDefined();
        expect(error instanceof ImperativeError).toBe(true);
        expect(error.message).toMatchSnapshot();
    });

    it("should detect missing root command name", () => {
        let error;
        try {
            const factory = new TestHelpGeneratorFactory({
                rootCommandName: undefined
            });
        } catch (e) {
            error = e;
        }
        expect(error).toBeDefined();
        expect(error instanceof ImperativeError).toBe(true);
        expect(error.message).toMatchSnapshot();
    });

    it("should detect missing command definition when getting a factory", () => {
        let error;
        try {
            const factory = new TestHelpGeneratorFactory({
                rootCommandName: "fruits"
            }).getHelpGenerator({commandDefinition: undefined, fullCommandTree: SAMPLE_COMMAND_TREE});
        } catch (e) {
            error = e;
        }
        expect(error).toBeDefined();
        expect(error instanceof ImperativeError).toBe(true);
        expect(error.message).toMatchSnapshot();
    });

    it("should detect missing command definition tree when getting a factory", () => {
        let error;
        try {
            const factory = new TestHelpGeneratorFactory({
                rootCommandName: "fruits"
            }).getHelpGenerator({commandDefinition: SAMPLE_COMMAND, fullCommandTree: undefined});
        } catch (e) {
            error = e;
        }
        expect(error).toBeDefined();
        expect(error instanceof ImperativeError).toBe(true);
        expect(error.message).toMatchSnapshot();
    });

    it("should return an instance of the test help generator", () => {
        const generator = new TestHelpGeneratorFactory({
            rootCommandName: "fruits"
        }).getHelpGenerator({commandDefinition: SAMPLE_COMMAND, fullCommandTree: SAMPLE_COMMAND_TREE});
        expect(generator).toBeDefined();
        expect(generator instanceof InheritedHelpGenerator).toBe(true);
        expect(generator.buildHelp).toBeDefined();
    });
});
