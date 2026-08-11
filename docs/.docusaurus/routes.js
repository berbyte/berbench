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
    component: ComponentCreator('/', '3ea'),
    routes: [
      {
        path: '/',
        component: ComponentCreator('/', '7ad'),
        routes: [
          {
            path: '/',
            component: ComponentCreator('/', 'e96'),
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
                path: '/skill',
                component: ComponentCreator('/skill', '8ba'),
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
