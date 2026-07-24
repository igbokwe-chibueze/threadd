<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Interaction feedback

Every user-triggered asynchronous action or navigation must provide immediate,
accessible loading feedback. Use specific labels such as `Searching…`,
`Saving…`, or `Loading ledger…`; disable repeated submissions while pending;
and preserve layout to avoid visual jumps. Do not leave users guessing whether
their action was received.
