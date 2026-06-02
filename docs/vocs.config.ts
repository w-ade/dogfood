import { defineConfig } from 'vocs/config'

export default defineConfig({
  title: 'Dogfood',
  description:
    'A tiny desktop forge where you prompt Claude Code to build a UI piece and watch it render live — in the real repo.',
  iconUrl: '/cowboy.svg',
  logoUrl: '/cowboy.svg',
  sidebar: [
    {
      text: 'Overview',
      link: '/',
    },
    {
      text: 'Concept',
      link: '/concept',
    },
    {
      text: 'Branding',
      link: '/branding',
    },
    {
      text: 'Look & feel',
      link: '/look-and-feel',
    },
    {
      text: 'Decisions',
      link: '/decisions',
    },
    {
      text: 'Architecture',
      link: '/architecture',
    },
    {
      text: 'Roadmap',
      link: '/roadmap',
    },
  ],
})
