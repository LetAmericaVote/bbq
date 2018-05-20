# ping

Core BBQ flavor that responds to PING requests.

## API Documentation

#### Get a ping response (text)

```
GET /text
```

```
ok
```
#### Get a ping response (json)

```
GET /json
```

```json
{
  "ok": true
}
```

## Installation

Requires Docker.

```sh
$ make install
$ make start
```
