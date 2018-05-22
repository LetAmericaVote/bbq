- Go ALL IN on JS (for bbq/flavors)
 - Use cluster module, maybe? Need a way to respawn the process after a request to cleanup, potentially.
 - Require flavors on demand / dynamically
 - Flavors expose a function that accepts request/response.
- Radically reduces latency & resource complexities
- Potential goal-post: Can we point multiple domains at here, and stick SSR flavors in bbq in order to handle client side rendering?
- Have a build command to clone all of the wrappers and run build commands in them
 - Let dev machine clone staging db to get the bbq config

Requires other "pillars" (probably??)

- Webhook generator??
 - UI to configure webhook reciepients, schedule clock based webhooks
 - API to trigger webhooks
 - Must be able to run large sums of webhooks at once
- Webhooks would call flavors, external services, etc

- Realtime Client Message bus??
 - Should have an http socket layer for web clients to subscribe too
 - Should have an API to send messages into it
 - Uni-directional?
- Used to power realtime collaborative admin side tools, potentially keep client side pages automatically up to date when content changes
