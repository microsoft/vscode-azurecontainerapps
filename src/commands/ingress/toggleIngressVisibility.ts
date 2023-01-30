import { IActionContext, nonNullValueAndProp } from "@microsoft/vscode-azext-utils";
import { IngressConstants } from "../../constants";
import { ContainerAppItem } from "../../tree/ContainerAppItem";
import { IngressItem } from "../../tree/IngressItem";
import { localize } from "../../utils/localize";
import { pickContainerApp } from "../../utils/pickContainerApp";
import { updateIngressSettings } from "./updateIngressSettings";

export async function toggleIngressVisibility(context: IActionContext, node?: IngressItem | ContainerAppItem): Promise<void> {
    node ??= await pickContainerApp(context);

    const ingress = nonNullValueAndProp(node.containerApp.configuration, 'ingress');
    const warningPrompt = localize('visibilityWarning', 'This will change the ingress visibility from "{0}" to "{1}".', ingress.external ? IngressConstants.external : IngressConstants.internal, !ingress.external ? IngressConstants.external : IngressConstants.internal)
    await context.ui.showWarningMessage(warningPrompt, { modal: true }, { title: localize('continue', 'Continue') });

    ingress.external = !ingress.external;
    const working: string = localize('updatingVisibility', 'Updating ingress visibility to "{0}"...', ingress.external ? IngressConstants.external : IngressConstants.internal);
    const workCompleted: string = localize('updatedVisibility', 'Updated ingress visibility to "{0}"', ingress.external ? IngressConstants.external : IngressConstants.internal);
    await updateIngressSettings(context, { ingress, subscription: node.subscription, containerApp: node.containerApp, working, workCompleted });
}
