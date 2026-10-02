// Serveur local avec "clean URLs" (équivalent de vercel.json) : npm run serve
const http = require("http"), fs = require("fs"), path = require("path");
const root = path.resolve(__dirname, "..");
const types = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".jpg": "image/jpeg", ".webp": "image/webp", ".xml": "application/xml", ".txt": "text/plain" };
http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split("?")[0]);
  const candidates = [p, p + ".html", path.join(p, "index.html")];
  const file = candidates.map((c) => path.join(root, c)).find((c) => c.startsWith(root) && fs.existsSync(c) && fs.statSync(c).isFile());
  if (!file) { res.writeHead(404, { "Content-Type": types[".html"] }); return res.end(fs.readFileSync(path.join(root, "404.html"))); }
  res.writeHead(200, { "Content-Type": types[path.extname(file)] || "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
}).listen(process.env.PORT || 4173, () => console.log("http://localhost:" + (process.env.PORT || 4173)));
