## Detecting Unsaved Changes

When comparing items for changes in single revision mode, prefer referencing the `containerApp` template.  When comparing items in multiple revisions mode, prefer referencing the `revision` template.

Reason:  Even though the `containerApp` template is essentially equivalent to the `latest` revision template... sometimes there are micro-differences present.  Although they end up being functionally equivalent, they may not always be equivalent enough to consistently pass a deep copy test (which is how we are set up to detect unsaved changes).

## Data Sources for Tree Items

Until the addition of revision drafts, the view has always reflected only one source of truth - the latest deployed changes.  With the addition of revision drafts, the view now prioritizes showing the latest draft `Unsaved changes` when they are present.  Model properties `containerApp` and `revision` should always be kept consistent with the latest deployed changes so that `hasUnsavedChanges` has the real data to easily compare against.

Other tree item properties may be directly tied to the view and are free to float between reflecting the revision draft vs. the real deployment data depending on the hierarchy of what exists at the time.
