# Watchhog

A lean alternative (I think?) to Sonarr.

## Background

Imma be honest: I haven't been able to install Sonarr, and I tried a few times
already. I just don't get why it's for, but when I asked the way to
automatically-ish add torrents to my qbittorrent instance, I was told to use
Sonarr. So I tried, and failed. And I made this.

## What is Watchhog?

Watchhog is a simple API that will search a qbittorrent search engine for a
given query, optionally filter it against a regex expression, and then return an
RSS feed for that show. Everything you need to configure is in the URL itself

## How to install?

For this project to work you'll need a few things:

- The project itself
- Deno as a runtime (you can use Docker too, image provided)
- The search engine libraries provided with qbittorrent
- A few search engines implementations

Provided as submodules there should be qbittorrent itself and the basic search
engines, although I encourage you to add your own. I tried to sparse-checkout
these submodules but I'm afraid I failed spectacularly, so you'll have to clone
the whole thing and then remove the stuff you don't need (or don't, it's not
that big).

First, clone the project:

```bash
git clone --recurse-submodules
```

Second, symlink the dependencies to the engines folder:

```bash
ln -s include/qBittorrent/src/searchengine/nova3/* engines
ln -s include/search-plugins/nova3/engines/* engines
```

Third, run or build the project:

```bash
deno run --allow-all main.ts
# OR
deno compile --allow-all main.ts
```

## How to use?

This project provides a single URL

```
/{search engine}/{query}?filter={regex}
```

- `search engine` is the name of the search engine you want to use. It's the
  name of the folder in the `engines` folder. NOTE: The classname and filename
  must be the same for the engine to work.
- `query` is the query you want to search for. It's the same as the one you'd
  use in qBittorrent.
- `regex` is an optional regex expression to filter the results. If you don't
  provide it, it will return all the results.

The default port is `8080`, and can't be changed at the moment. I mean, you can
tweak the source code, it's like 100 lines, and you can event redirect the port
using Docker
