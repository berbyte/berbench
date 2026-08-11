// @ts-check

import {themes as prismThemes} from 'prism-react-renderer';

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'BERBench',
  tagline: 'Benchmark AI coding tools against real bugs from your repository.',
  favicon: 'img/favicon.svg',

  url: process.env.DOCUSAURUS_URL ?? 'http://localhost:3000',
  baseUrl: process.env.DOCUSAURUS_BASE_URL ?? '/',

  onBrokenLinks: 'throw',
  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'throw',
    },
  },

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          path: 'content',
          routeBasePath: '/',
          sidebarPath: './sidebars.js',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      },
    ],
  ],

  themes: [
    [
      '@easyops-cn/docusaurus-search-local',
      {
        hashed: true,
        indexDocs: true,
        indexBlog: false,
        docsDir: 'content',
        docsRouteBasePath: '/',
        language: ['en'],
      },
    ],
  ],

  themeConfig: {
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'BERBench',
      logo: {
        alt: 'BERBench logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'guideSidebar',
          position: 'left',
          label: 'Guides',
        },
        {
          to: '/how-to/bedrock',
          position: 'left',
          label: 'How-to',
        },
        {
          to: '/yaml-reference',
          position: 'left',
          label: 'Reference',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Start here',
          items: [
            {label: 'Overview', to: '/'},
            {label: 'Getting started', to: '/getting-started'},
            {label: 'Run a benchmark', to: '/run-an-experiment'},
          ],
        },
        {
          title: 'Reference',
          items: [
            {label: 'YAML configuration', to: '/yaml-reference'},
            {label: 'Claude Code on Bedrock', to: '/how-to/bedrock'},
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} BERBench contributors.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'docker', 'yaml'],
    },
  },
};

export default config;
