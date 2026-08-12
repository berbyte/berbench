/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  guideSidebar: [
    {
      type: 'category',
      label: 'Start here',
      collapsed: false,
      items: ['index', 'getting-started', 'run-an-experiment'],
    },
    {
      type: 'category',
      label: 'Core concepts',
      collapsed: false,
      items: ['challenges', 'experiments'],
    },
    {
      type: 'category',
      label: 'How-to guides',
      collapsed: false,
      items: ['how-to/workflows', 'how-to/bedrock', 'how-to/context-tools', 'skill'],
    },
    {
      type: 'category',
      label: 'Reference',
      collapsed: false,
      items: ['yaml-reference'],
    },
  ],
};

export default sidebars;
