
import { defineStore } from 'pinia';
import blogData from './blog.json';

export interface BlogEntry {
  slug: string;
  title: string;
  description: string;
  content: string;
  gallery: string[];
  author: {
    name: string;
    email: string;
    phone: string;
  };
  date: string;
}

export const useBlogStore = defineStore('blogStore', {
  state: () => ({
    entries: blogData as BlogEntry[],
  }),
  actions: {
    loadEntries() {
      // No-op for compatibility with previous async usage
    },
  },
  getters: {
    getBySlug: (state) => (slug: string) => state.entries.find(e => e.slug === slug),
  },
});
