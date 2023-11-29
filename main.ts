import { encodeUrl } from "https://deno.land/x/encodeurl@1.0.0/mod.ts";
import { stringify } from "https://deno.land/x/xml@2.1.3/mod.ts"
import { Application, Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { getQuery } from "https://deno.land/x/oak@v12.6.1/helpers.ts";

const INTERNAL_FILES = [
  "wrapper.py",
  "helpers.py",
  "nova2.py",
  "nova2dl.py",
  "novaprinter.py",
  "socks.py",
];
async function listEngines() {
  const engines = []
  for await (const file of Deno.readDir("engines")) {
    if (file.isFile && !INTERNAL_FILES.includes(file.name) && file.name.endsWith(".py")) {
      engines.push(file.name.replace(".py", ""));
    }
  }
  return engines;
}

export interface TorrentURL {
  url: string;
  xt: string;
  /* Readable name */
  dn: string;
  tr: string[];
}

function correctObjectFromEntries(entries: IterableIterator<[string, string]>) {
  const obj: Record<string, string | string[]> = {};
  for (const [key, value] of entries) {
    if (key in obj) {
      obj[key] = Array.isArray(obj[key])
        ? [...obj[key], value] as string[]
        : [obj[key], value] as string[];
    } else {
      obj[key] = value;
    }
  }
  return obj;
}

export async function searchTorrents(engine: string, query: string) {
  const command = new Deno.Command("python", {
    args: [
      `engines/wrapper.py`,
      engine,
      encodeUrl(query),
    ],
  });

  // create subprocess and collect output
  const { code, stdout, stderr } = await command.output();

  return {
    success: code === 0,
    err: new TextDecoder().decode(stderr),
    res: new TextDecoder()
      .decode(stdout)
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.startsWith("magnet:"))
      // Parse query params
      .map((line) => [new URLSearchParams(line.replace("magnet:?", "")), line] as const)
      // Convert to object
      .map(([params, url]) => ({
        ...correctObjectFromEntries(params.entries()) as unknown as TorrentURL,
        url
      })
      ),
  };
}

export async function searchToRSS(engine: string, query: string, reg_filter?: RegExp) {
  const { res, err, success } = await searchTorrents(engine, query);
  if (!success) throw new Error(err);
  const filtered = res
    .filter((torrent) => !reg_filter || reg_filter.test(torrent.dn));
  return {
    rss: stringify({
      rss: {
        "@version": "2.0",
        "@xmlns:dc": "http://purl.org/dc/elements/1.1/",
        channel: {
          title: "Watch Hog",
          date: new Date().toUTCString(),
          item: filtered.map((torrent) => ({
            title: torrent.dn,
            link: torrent.xt,
            guid: torrent.xt,
            url: torrent.url,
            enclosure: {
              "@url": torrent.url,
              "@_type": "application/x-bittorrent"
            }
          })),
        }
      }
    }),
    data: filtered,
  }
}

// http://192.168.100.242:8080/?engine=nyaasi&query=Goblin%20slayer&filter=\[SubsPlease\]%20Goblin%20Slayer%20S[0-9]%20-%20[0-9][0-9].*\(1080p\)%20.*\.mkv

const router = new Router();
router.get("/rss/:engine/:query", async (context) => {
  const { engine, query, filter } = getQuery(context, { mergeParams: true });
  console.log(`Searching ${engine} for ${query} with filter ${filter}`)
  try {
    const { rss, data } = await searchToRSS(engine, query, filter ? new RegExp(filter) : undefined);
    console.log(`Found ${data.length} results for ${query} with filter ${filter} on ${engine}`)
    context.response.body = rss;
    context.response.headers.set("Content-Type", "application/xml");
  } catch (e) {
    console.error(e);
    context.response.body = e.message;
    context.response.headers.set("Content-Type", "text/plain");
  }
}).get("/engines", async (context) => {
  context.response.body = JSON.stringify(await listEngines())
  context.response.headers.set("Content-Type", "application/json");
});

const app = new Application();
app.use(router.routes());
app.use(router.allowedMethods());

await app.listen({ port: 8080 });