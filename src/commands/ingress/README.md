Maybe we should get a list of all potential ports and store those.
When checking for the default port, we can check if the existing target port is within the list of ports we detected in the Dockerfile.
If it is, just re-offer the existing target port.  If not, offer the first detected dockerfile port...
Only show this logic when a dockerfile is found in the configureBeforePrompt.

Secondarily, are there cases where we shouldn't even prompt at all and just offer the existing port?
I'm thinking if you are doing a conventional deploy and you haven't had to update the image except for the tag, that you can just leverage the existing port...
