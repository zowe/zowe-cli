/*
* This program and the accompanying materials are made available under the terms of the *
* Eclipse Public License v2.0 which accompanies this distribution, and is available at *
* https://www.eclipse.org/legal/epl-v20.html                                      *
*                                                                                 *
* SPDX-License-Identifier: EPL-2.0                                                *
*                                                                                 *
* Copyright Contributors to the Zowe Project.                                     *
*                                                                                 *
*/

import { Application, registerComponent } from "./typedoc/Application";
import { MenuHighlight } from "./typedoc/components/MenuHighlight";
import { initSearch } from "./typedoc/components/Search";
import { Signature } from "./typedoc/components/Signature";
import { Toggle } from "./typedoc/components/Toggle";
import { Filter } from "./typedoc/components/Filter";

import "../../css/main.sass";

initSearch();

registerComponent(MenuHighlight, ".menu-highlight");
registerComponent(Signature, ".tsd-signatures");
registerComponent(Toggle, "a[data-toggle]");

if (Filter.isSupported()) {
    registerComponent(Filter, "#tsd-filter");
} else {
    document.documentElement.classList.add("no-filter");
}

const app: Application = new Application();

Object.defineProperty(window, "app", { value: app });
