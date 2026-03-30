/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ConfirmationView } from "./ConfirmationView";
import { CreateProjectView } from "./CreateProjectView";
import { LoadingView } from "./LoadingView";
import { LocalPlanView } from "./LocalPlanView";
import { PlanView } from "./PlanView";

export const WebviewRegistry = {
    confirmationView: ConfirmationView,
    createProjectView: CreateProjectView,
    loadingView: LoadingView,
    localPlanView: LocalPlanView,
    planView: PlanView,
} as const;
