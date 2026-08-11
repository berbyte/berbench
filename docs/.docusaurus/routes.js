import React from 'react';
import ComponentCreator from '@docusaurus/ComponentCreator';

export default [
  {
    path: '/search',
    component: ComponentCreator('/search', '822'),
    exact: true
  },
  {
    path: '/',
    component: ComponentCreator('/', 'ee2'),
    routes: [
      {
        path: '/',
        component: ComponentCreator('/', 'e94'),
        routes: [
          {
            path: '/',
            component: ComponentCreator('/', '97d'),
            routes: [
              {
                path: '/challenges',
                component: ComponentCreator('/challenges', '85d'),
                exact: true,
                sidebar: "guideSidebar"
              },
              {
                path: '/experiments',
                component: ComponentCreator('/experiments', 'a60'),
                exact: true,
                sidebar: "guideSidebar"
              },
              {
                path: '/getting-started',
                component: ComponentCreator('/getting-started', '434'),
                exact: true,
                sidebar: "guideSidebar"
              },
              {
                path: '/how-to/bedrock',
                component: ComponentCreator('/how-to/bedrock', '056'),
                exact: true,
                sidebar: "guideSidebar"
              },
              {
                path: '/run-an-experiment',
                component: ComponentCreator('/run-an-experiment', '40c'),
                exact: true,
                sidebar: "guideSidebar"
              },
              {
                path: '/yaml-reference',
                component: ComponentCreator('/yaml-reference', 'e13'),
                exact: true,
                sidebar: "guideSidebar"
              },
              {
                path: '/',
                component: ComponentCreator('/', '11b'),
                exact: true,
                sidebar: "guideSidebar"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    path: '*',
    component: ComponentCreator('*'),
  },
];
