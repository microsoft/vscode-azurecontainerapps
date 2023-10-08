## Commands

- `deployImageApi` - A command shared with the `vscode-docker` extension.  It uses our old `deployImage` command flow which immediately tries to deploy the image to a container app without creating a draft.  This command cannot be used to bundle template changes.

<!-- Todo: Add this back in when update image command is added in follow-up PR -->
<!-- - `updateImage` - An ACA only command that updates the container app or revision's container image through a revision draft.  The draft must be deployed for the changes to become permanent and can be used to bundle template changes. -->
