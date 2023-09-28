## Commands

- `deployImageApi` - A command shared with the `vscode-docker` extension.  It uses our old `deployImage` command flow which immediately tries to deploy the image to a container app without creating a draft.

- `updateImage` - An ACA only command that updates the container app or revision's container image through a revision draft.  The draft must be deployed for the changes to become permanent.
