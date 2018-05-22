# bbq

Functions as a Service (FaaS) provider.

This platform runs Flavors (functions || nano-services || lambda), which are small, highly portable NodeJs apps that have a singular specific purpose. bbq manages the instantiation and termination of flavors based on the incoming traffic.

Flavors lifespans are highly unstable, they can be started and stopped at any moment based on traffic. Flavors are also highly portable, almost no configuration is required to make your code compatible with bbq.

BBQ provides a runtime for flavors to be executed and managed in, along with a common interface and API for building and deploying flavors.

_KIGS (Keep it grassroots, stupid)_

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
