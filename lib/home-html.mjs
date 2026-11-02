export function optimizeHomeHtml(html) {
  if (!html.includes('href="/lcp/') || html.includes('id="ajja-boot"')) return html;
  const link = html.match(/<link rel="preload" as="image"[^>]*>/)?.[0];
  if (!link) return html;
  let next = html.replace(link, "");
  const viewport = '<meta name="viewport" content="width=device-width, initial-scale=1"/>';
  if (next.includes(viewport)) next = next.replace(viewport, `${viewport}${link}`);
  const srcs = [];
  next = next.replace(/<script src="([^"]+)"(?: async=""| defer="")><\/script>/g, (_full, src) => {
    srcs.push(src);
    return "";
  });
  next = next.replace(/<link rel="preload" as="script"[^>]*>/g, "");
  if (!srcs.length || !next.includes("</body>")) return html;
  const boot = `<script id="ajja-boot">(function(){var srcs=${JSON.stringify(srcs)};function boot(){if(window.__ajjaBoot)return;window.__ajjaBoot=1;for(var i=0;i<srcs.length;i++){var s=document.createElement("script");s.src=srcs[i];s.async=false;document.body.appendChild(s);}}function later(){requestAnimationFrame(function(){requestAnimationFrame(boot);});}var hero=document.querySelector("img.hero-photo");if(hero&&!hero.complete){hero.addEventListener("load",later);hero.addEventListener("error",boot);}else{later();}})();</script>`;
  return next.replace("</body>", `${boot}</body>`);
}
