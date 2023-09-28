import type { DocsThemeConfig } from 'nextra-theme-docs';
import CurrentYear from './src/components/current-year';

const config: DocsThemeConfig = {
  logo: (
    <div className="flex items-center">
      <span className="font-bold text-xl ml-2 tracking-wide">plugx</span>
    </div>
  ),
  project: {
    link: 'https://github.com/plugxjs/plugx',
  },
  i18n: [],
  docsRepositoryBase: 'https://github.com/plugxjs/plugx/blob/master/docs/',
  gitTimestamp() {
    return null;
  },
  footer: {
    text() {
      return (
        <>
          MIT License | <span className="mx-1">&copy;</span> <CurrentYear defaultYear={2023} />
        </>
      );
    },
  },
};

export default config;
