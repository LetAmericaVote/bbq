# bbq

Functions as a Service (FaaS) provider.

This platform runs Flavors (functions || nano-services || lambda), which are small, highly portable containerized apps that have a singular specific purpose. bbq manages the instantiation and termination of flavors based on the incoming traffic.

BBQ provides a runtime for flavors to be executed and managed in, along with a common interface and API for building and deploying flavors.

## Core Principals

- Flavors live inside (Docker) containers and are well isolated.
- Flavors lifespans are highly unstable, they can be started and stopped at any moment based on traffic.
- Must provide intuitive & developer friendly CI/CD pipeline for Flavors. With that, bbq provides a clean interface for managing logs, environment variables.
- Flavors are highly portable, almost no configuration is required to make your code compatible with bbq.

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
