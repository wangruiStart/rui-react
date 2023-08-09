import path from 'path';
import fs from 'fs';
import ts from 'rollup-plugin-typescript2';
import cjs from '@rollup/plugin-commonjs';
import replace from '@rollup/plugin-replace';

const pkgPath = path.resolve(__dirname, '../../packages');
const distPath = path.resolve(__dirname, '../../dist/node_modules');
/**
 * Resolves package paths based on the given package name and distribution flag.
 *
 * @param {string} pkgName - The name of the package.
 * @param {boolean} isDist - A flag indicating whether the package is a distribution package.
 * @return {object} An empty object.
 */
export function resolvePackagePaths(pkgName, isDist) {
	if (isDist) {
		return `${distPath}/${pkgName}`;
	}
	return `${pkgPath}/${pkgName}`;
}

export function getPackageJSON(pkgName) {
	const path = `${resolvePackagePaths(pkgName, false)}/package.json`;
	const str = fs.readFileSync(path, 'utf8');
	return JSON.parse(str);
}

export function getBaseRollupPlugins({
	alias = {
		__DEV__: true
	},
	typescriptConfig = {}
} = {}) {
	return [replace(alias), cjs(), ts(typescriptConfig)];
}
