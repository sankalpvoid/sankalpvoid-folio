/* One source of truth for the six exhibitions: order, names, routes, preview art and the primary action of each story.
   The gallery, the project rail, the drag-to-next-project peel and the story hand-offs all read this list.
   Order is the gallery's order; after the last project the collection wraps to the first. */
(() => {
  const list = [
    { slug: 'reclaim', gallery: 'reclaim', name: 'Reclaim', no: '01', href: '/work/reclaim/', art: '/assets/img/idx/reclaim.jpg', action: { label: 'View live prototype', href: 'https://reclaim-app-tawny.vercel.app/', external: true } },
    { slug: 'wealthwithsg', gallery: 'wealthwithsg', name: 'WealthWithSG', no: '02', href: '/work/wealthwithsg/', art: '/assets/img/idx/wealthwithsg.jpg', action: { label: 'View live experience', href: 'https://wealthwithsg.vercel.app/', external: true } },
    { slug: 'sankalp-shristi-furnishers', gallery: 'sankalp-shristi-furnishers', name: 'Furnishers', full: 'Sankalp & Shristi Furnishers', no: '03', href: '/work/sankalp-shristi-furnishers/', art: '/assets/img/idx/sankalp-shristi-furnishers.jpg', action: { label: 'View hero prototype', href: 'https://sankalp-shristi-furnishers-git-claude-hero-p-2877d3-sankalpvoid.vercel.app/lab/hero', external: true } },
    { slug: 'aureledger', gallery: 'aureledger', name: 'Aureledger', no: '04', href: '/work/aureledger/', art: '/assets/img/idx/aureledger.jpg', action: { label: 'View live experience', href: 'https://aureledger.vercel.app/', external: true } },
    { slug: 'kaal', gallery: 'kaal', name: 'Kaal', no: '05', href: '/work/kaal/', art: '/assets/img/idx/kaal.jpg', action: { label: 'Explore presence', href: '#presence', external: false } },
    { slug: 'experiments', gallery: 'archive', name: 'Experiments', no: '06', href: '/work/experiments/', art: '/assets/img/idx/experiments.jpg', action: { label: 'Try a study', href: '#cyberpunk', external: false } }
  ];
  const at = (slug) => list.findIndex((p) => p.slug === slug || p.gallery === slug);
  window.SVProjects = {
    list,
    get: (slug) => list[at(slug)] || null,
    next: (slug) => list[(at(slug) + 1) % list.length],
    prev: (slug) => list[(at(slug) - 1 + list.length) % list.length],
    /* the project a path belongs to, e.g. /work/reclaim/ */
    fromPath: (path = location.pathname) => list.find((p) => path.startsWith(p.href)) || null
  };
})();
