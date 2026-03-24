import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */
const sidebars: SidebarsConfig = {
  bookSidebar: [
    'intro',
    'quarter-overview',
    {
      type: 'category',
      label: 'Module 1: ROS 2 for Humanoids',
      link: {type: 'doc', id: 'module-1-ros2/intro'},
      items: [
        'module-1-ros2/intro',
        'module-1-ros2/ros2-basics',
        'module-1-ros2/nodes-topics-services',
        'module-1-ros2/urdf-humanoids',
      ],
    },
    {
      type: 'category',
      label: 'Module 2: Digital Twin',
      link: {type: 'doc', id: 'module-2-digital-twin/intro'},
      items: [
        'module-2-digital-twin/intro',
        'module-2-digital-twin/gazebo-simulation',
        'module-2-digital-twin/unity-hri',
        'module-2-digital-twin/sensors',
      ],
    },
    {
      type: 'category',
      label: 'Module 3: NVIDIA Isaac',
      link: {type: 'doc', id: 'module-3-isaac/intro'},
      items: [
        'module-3-isaac/intro',
        'module-3-isaac/isaac-sim',
        'module-3-isaac/isaac-ros',
        'module-3-isaac/nav2',
      ],
    },
    {
      type: 'category',
      label: 'Module 4: Vision-Language-Action',
      link: {type: 'doc', id: 'module-4-vla/intro'},
      items: [
        'module-4-vla/intro',
        'module-4-vla/voice-to-action',
        'module-4-vla/llm-planning',
        'module-4-vla/capstone',
      ],
    },
  ],
};

export default sidebars;
