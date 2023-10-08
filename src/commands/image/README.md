## Commands

- `deployImageApi` - A command shared with the `vscode-docker` extension.  It uses our old `deployImage` command flow which immediately tries to deploy the image to a container app without creating a draft.  This command cannot be used to bundle template changes.

- `updateImage` - An ACA exclusive command that updates the container app or revision's container image via revision draft.  The draft must be deployed for the changes to take effect and can be used to bundle together `Template` changes.
