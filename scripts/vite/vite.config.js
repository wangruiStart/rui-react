import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import replace from '@rollup/plugin-replace';
import { resolvePackagePaths } from '../rollup/utils';
import path from 'path';

export default defineConfig({
	plugins: [
		react(),
		replace({
			__DEV__: true,
			preventAssignment: true
		})
	],
	resolve: {
		alias: [
			{
				find: 'react',
				replacement: resolvePackagePaths('react')
			},
			{
				find: 'react-dom',
				replacement: resolvePackagePaths('react-dom')
			},
			{
				find: 'hostConfig',
				replacement: path.resolve(
					resolvePackagePaths('react-dom'),
					'./src/hostConfig.ts'
				)
			}
		]
	}
});
