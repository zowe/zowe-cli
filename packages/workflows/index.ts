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

/**
 * Use the index.ts to export any public facing APIs/intefaces/etc.
 *
 * If your plugin introduces a set of APIs/functions that others would find useful when building node apps
 * (or editor extensions, etc.) export them here.
 *
 * For example, Zowe CLI offers Jobs APIs that can be invoke programmatically from a VS code extension to create
 * a Job viewer/tree extension.
 */

export * from "./src/api/Create";
export * from "./src/api/Delete";
export * from "./src/api/Start";
export * from "./src/api/Properties";
export * from "./src/api/ListWorkflows";
export * from "./src/api/Cancel";
export * from "./src/api/Definition";
export * from "./src/api/ArchivedDelete";
export * from "./src/api/ArchiveWorkflow";
export * from "./src/api/ListArchivedWorkflows";

export * from "./src/api/doc/IActiveWorkflows";
export * from "./src/api/doc/IArchivedWorkflow";
export * from "./src/api/doc/IArchivedWorkflows";
export * from "./src/api/doc/IAutomationStatus";
export * from "./src/api/doc/ICreateWorkflow";
export * from "./src/api/doc/ICreatedWorkflow";
export * from "./src/api/doc/ICreatedWorkflowLocal";
export * from "./src/api/doc/IJobFiles";
export * from "./src/api/doc/IJobFiles";
export * from "./src/api/doc/IJobFiles";
export * from "./src/api/doc/IJobInfo";
export * from "./src/api/doc/IJobStatus";
export * from "./src/api/doc/IPropertyMapping";
export * from "./src/api/doc/IStartWorkflow";
export * from "./src/api/doc/IStepApprovers";
export * from "./src/api/doc/IStepDefinition";
export * from "./src/api/doc/IStepInfo";
export * from "./src/api/doc/IStepSummary";
export * from "./src/api/doc/IVariable";
export * from "./src/api/doc/IVariableDefinition";
export * from "./src/api/doc/IVariableInfo";
export * from "./src/api/doc/IVariableSpecification";
export * from "./src/api/doc/IWorkflowDefinition";
export * from "./src/api/doc/IWorkflowInfo";
export * from "./src/api/doc/IWorkflows";
export * from "./src/api/doc/IWorkflowsInfo";