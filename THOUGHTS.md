## NEW
- Embrace JS to its max.
- Add post-deploy script to bootstrap all of the functions (clone + npm install) and extract their config settings from a bbq file
 - Maybe we store the config in a JSON file in S3, and make that URL an environment variable?
 - Flavor config file defines middleware stack, pathname, etc
- Spin up the clustered process
- Flavors export an async function which accepts the bbq engine and flavor menu as params. (and maybe boring stuff like Logging & stathat)
 - This lets flavors spin up other flavors and call them super fast.
 - This async function should return another function, which indicates the flavor is loaded and also represents the flavor itself.
 - If the flavor maps to a pathname, it should accept a Koa context as a parameter. Otherwise, the function can accept and do whatever it wants.

## OLD
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
