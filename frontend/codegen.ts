import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: '../graphql/schema.graphql',
  documents: ['src/graphql/**/*.{ts,tsx}'],
  generates: {
    './src/graphql/generated/': {
      preset: 'client',
      config: {
        useTypeImports: true
      }
    }
  }
};

export default config;
