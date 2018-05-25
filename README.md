# bbq

Functions as a Service (FaaS) provider.

This platform runs flavors, which are small, highly portable NodeJs modules that have a singular specific purpose. bbq is a platform to orchestrate the deployment and runtime of these flavors.

## Why not AWS Lambda/Google Cloud Functions/etc?

The underlying operating principle is not _KISS (Keep it simple, stupid)_ but rather _KIGS (Keep it grassroots, stupid)_.

Political campaigns and advocacy campaigns require a network of interconnected tools, but these tools often don't adequately provide everything a digital strategist needs, or might do so in a poor fashion due to age or simply bad UX. This can make it difficult for campaigns and organizations to innovate with political tech, especially when you don't have the budget to DIY everything yourself.

Bbq provides a cost effective way for a grassroots organization to DIY new tools and products without breaking the bank in server costs, and enforce an architecture that blends well with external services. Additionally, it drops the hassle of configuring Lambda's, API gateways, and makes testing much easier.

Lastly, this cannot be proven yet due to the fact bbq is still in development, but from a philosophical standpoint bbq will be faster and more effective than AWS Lambdas, due to the strict NodeJs adherence of the platform. Flavors are invoked directly as modules from the node runtime, in comparison to a system such as AWS which warms containers and proxies HTTP requests. Because of this, flavors are guaranteed to always be available but without the cost of constantly running them. Further, this allows flavors to quickly natively require _other_ flavors, allowing deep composition and middleware stacking that would be more difficult to replicate on AWS Lambda.

## Install (Development)

Requires [Docker](https://docs.docker.com/install/).

```sh
$ git clone https://github.com/letamericavote/bbq

# Make sure BBQ_ENV=development is present
$ cp .env.example .env

$ make install
$ make start

# make stop
# make restart
```
