## Detecting Unsaved Changes

When comparing items for changes in single revision mode, prefer referencing the `containerApp` template.  When comparing items in multiple revisions mode, prefer referencing the `revision` template.

Reason:  Even though the `containerApp` template is essentially equivalent to the `latest` revision template... sometimes there are micro-differences present.  Although they end up being functionally equivalent, they may not always be equivalent enough to consistently pass a deep copy test (which is how we are set up to detect unsaved changes).

## Data Sources for Tree Items

Until the addition of revision drafts, the view has always reflected only one source of truth - the latest deployed changes.  With the addition of revision drafts, the view now prioritizes showing the latest draft `Unsaved changes` when they are present.  Model properties `containerApp` and `revision` should be kept consistent with the latest deployed changes so that methods like `hasUnsavedChanges` always have a reliable data reference for deep copy comparison.

## Adding HTTP scale rules

Adding a scale rule appends it to the draft without deleting existing rules in Express or Standard environments. Single-mode edits start from the app template; Multiple-mode edits start from the selected revision. Existing drafts retain their accumulated rules and settings.

The service can return different rule arrays in app and revision templates. Live Standard checks returned multiple HTTP rules in the app template but only the newest HTTP rule in the revision template. Preserve the chosen edit source rather than deleting rules in the client or substituting the app template for a selected revision. Retaining app configuration does not establish how multiple HTTP rules affect autoscaling.
