/**
 * Tells Bing (and the other IndexNow search engines) that pages changed, so
 * they recrawl them now instead of whenever they next pass. ChatGPT's web
 * search answers from Bing's index, so this is how a change reaches it fastest.
 *
 *   npx tsx scripts/indexnow.ts            every URL in the live sitemap
 *   npx tsx scripts/indexnow.ts /about     just these paths
 *
 * The key is public by design: IndexNow checks it at /<key>.txt on the site
 * to prove the submission comes from whoever controls the domain.
 */
const HOST = 'www.procurveux.com';
const KEY = '47e86615b7f69a4d38f49f99ec3cb615';

async function main() {
  const paths = process.argv.slice(2);
  let urls: string[];
  if (paths.length) {
    urls = paths.map((p) => `https://${HOST}${p.startsWith('/') ? p : `/${p}`}`);
  } else {
    const xml = await (await fetch(`https://${HOST}/sitemap.xml`)).text();
    urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  }
  const keyFile = await fetch(`https://${HOST}/${KEY}.txt`);
  if (!keyFile.ok || (await keyFile.text()).trim() !== KEY) throw new Error(`The key file is not live at https://${HOST}/${KEY}.txt yet. Deploy first.`);

  const res = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'content-type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host: HOST, key: KEY, keyLocation: `https://${HOST}/${KEY}.txt`, urlList: urls }),
  });
  // 200 and 202 both mean accepted.
  console.log(`IndexNow: ${res.status} ${res.statusText} for ${urls.length} URL(s)`);
  if (res.status >= 400) process.exit(1);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
