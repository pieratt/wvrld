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
