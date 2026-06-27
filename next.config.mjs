import createMDX from '@next/mdx';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = dirname(fileURLToPath(import.meta.url));

const nextConfig = {
  pageExtensions: ['js', 'jsx', 'md', 'mdx'],
  turbopack: {
    root: projectRoot,
  },
};

const withMDX = createMDX({
  options: {
    rehypePlugins: [
      [
        'rehype-pretty-code',
        {
          keepBackground: false,
          theme: {
            dark: 'github-dark-default',
            light: 'github-light-default',
          },
        },
      ],
    ],
  },
});

export default withMDX(nextConfig);
