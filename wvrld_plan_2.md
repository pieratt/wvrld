1 Tailwind + CSS-var plumbing
File: tailwind.config.ts

ts
Copy
Edit
// ⬇ add this inside theme.extend.colors
colors: {
  pagebg: 'var(--c2)',
  pagetext: 'var(--c1)',
  cardbg: 'var(--c1)',
  cardtext: 'var(--c2)',
  pillbg: 'var(--c2)',
  pilltext: 'var(--c1)',
},
This lets Tailwind classes like bg-pagebg resolve at runtime from CSS vars.

2 Inject vars at layout level
File: app/layout.tsx (or equivalent top wrapper)

tsx
Copy
Edit
// inside the layout component …
const { color1, color2 } = paletteForPageOwner(); // already computed
return (
  <html lang="en">
    <body
      style={{
        // exposes vars to every descendant + tailwind runtime colors
        '--c1': color1,
        '--c2': color2,
      } as React.CSSProperties}
      className="bg-pagebg text-pagetext"
    >
      {children}
    </body>
  </html>
);

3 globals.css patch
File: styles/globals.css (apply verbatim)

diff
Copy
Edit
@@
 body {
-  background: var(--background);
-  color: var(--foreground);
+  /* these are only a dark-mode fallback.
+     real colors come from runtime CSS vars injected in layout.tsx */
+  background: var(--c2, var(--background));
+  color: var(--c1, var(--foreground));
   font-family: Arial, Helvetica, sans-serif;
 }
 
+.post-card    { @apply bg-cardbg text-cardtext rounded-md p-4 flex flex-col gap-3; }
+.post-title   { @apply text-center font-bold; }
+.post-author  { @apply text-center meta-text; }
+.url-row      { @apply flex gap-3 items-start; }
+.url-row .ico { width: 32px; height: 32px; flex: none; }  /* 2× current */
+.meta-link    { @apply underline hover:no-underline cursor-pointer; }
+.meta-link.saved { text-decoration: underline; }
+
+.tld-pill     { @apply bg-pillbg text-pilltext rounded-full px-4 py-1 w-full
+                       flex justify-between items-center cursor-pointer; }
+.tld-pill.off { @apply opacity-30; }
+.tld-list     { @apply flex flex-col gap-2; }  /* stacked pills */
+
 /* existing utility layers stay below */
 
4 PostCard component tidy
File: components/PostCard.tsx

tsx
Copy
Edit
export default function PostCard({ grouped }: { grouped: GroupedPost }) {
  const { bg, fg } = palette({ cardOwner: grouped.canonicalOwner, isFront })
  return (
    <section
      className="post-card masonry-item"
      style={{ '--c1': bg, '--c2': fg } as React.CSSProperties}
    >
      <header>
        <h3 className="post-title">{grouped.title || 'Untitled'}</h3>
        <p className="post-author">@{grouped.canonicalOwner.username}</p>
      </header>

      {grouped.posts.flatMap(renderURLs)}
      <button className="self-center mt-2 meta-link" onClick={…}>
        See All
      </button>
    </section>
  )
}
renderURLs spits out .url-row with the big favicon + .meta-links for domain / username / save.

5 URL meta links
File: components/UrlRow.tsx (new small component)

tsx
Copy
Edit
export function UrlRow({ url, owner }: { url: URL; owner: User }) {
  return (
    <div className="url-row">
      <img src={favicon(url)} className="ico" />
      <div>
        <a href={url.url} className="meta-link">{url.domain}</a>{' '}
        <span className="meta-link" onClick={()=>router.push('/'+owner.username)}>
          @{owner.username}
        </span>{' '}
        <SaveToggle urlId={url.id} />
      </div>
    </div>
  )
}
SaveToggle keeps/returns the saved state and applies className={saved?'meta-link saved':'meta-link'}.

6 DomainFilter pills
File: components/DomainFilterBar.tsx

tsx
Copy
Edit
export function DomainFilterBar({ domains }: { domains: DomainCount[] }) {
  const { tlds, toggleTld } = useFilters()
  return (
    <nav className="tld-list">
      {domains.slice(0,10).map(({ domain, count }) => {
        const on = tlds.has(domain)
        return (
          <button
            key={domain}
            className={clsx('tld-pill', { off: !on })}
            style={{ '--c1': on ? 'var(--c1)' : 'var(--c2)',
                     '--c2': on ? 'var(--c2)' : 'var(--c1)' } as any}
            onClick={() => toggleTld(domain)}
          >
            {domain} <span className="meta-text">({count})</span>
          </button>
        )
      })}
    </nav>
  )
}
clsx ensures we flip off style (fades 30 %) when pill is toggled off.

7 Editor pill hover reveal
File: components/EditorPill.tsx

tsx
Copy
Edit
export default function EditorPill({ user }: { user: User }) {
  // page palette already enforced by layout
  return (
    <a
      href={'/' + user.username}
      className="rounded-full px-4 py-1 bg-pillbg text-pilltext transition-none"
      style={{
        '--hover-c1': user.color1,
        '--hover-c2': user.color2,
      } as any}
      onMouseEnter={e=>e.currentTarget.style.background='var(--hover-c1)'}
      onMouseLeave={e=>e.currentTarget.style.background='var(--c2)'}
    >
      {user.username}
    </a>
  )
}
8 Smoke tests (Cypress)
Make sure a post’s .post-card actually carries the canonical owner colors.

Toggle two pills → URL query ?tlds= updates, .tld-pill.off toggles.

Hover editor pill → background changes instantly; mouse-leave restores.

