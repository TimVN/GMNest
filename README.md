<p align="center">
  <img src="https://i.imgur.com/FqK7k6l.png" width="320" alt="GMNest Logo" />
</p>

<p align="center">A simple setup for multiplayer HTML5 games</p>

## Description

[Nest](https://github.com/nestjs/nest) framework chat server example for GMNest

## Installation

```bash
$ npm install
```

Add .env.development file to project root and add the following settings:

```
REDIS_HOST=localhost
REDIS_PORT=6379
```

Make sure to have [Docker](https://www.docker.com/) installed. Refer to the [docs here](https://docs.docker.com/get-docker/).

```bash
$ cd docker
$ docker-compose up 
```

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Twitter - [@ElCapitanT](https://twitter.com/ElCapitanT)
- Discord - [GMNest](https://discord.gg/Ass6FYuc2G)
