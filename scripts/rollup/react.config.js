import generatePackageJSON from 'rollup-plugin-generate-package-json';
import {
	getPackageJSON,
	resolvePackagePaths,
	getBaseRollupPlugins
} from './utils';

const { name, module, description, version } = getPackageJSON('react');
// 包的路径
const pkgPath = resolvePackagePaths(name, false);
// 产物的路径
const pkgDistPath = resolvePackagePaths(name, true);

export default [
	// react包
	{
		input: `${pkgPath}/${module}`,
		output: {
			file: `${pkgDistPath}/index.js`,
			name: 'React',
			format: 'umd'
		},
		plugins: [
			...getBaseRollupPlugins(),
			generatePackageJSON({
				inputFolder: `${pkgPath}`,
				outputFolder: `${pkgDistPath}`,
				/**
				 * 打包目录生成package.json文件并指定文件内容.
				 *
				 * @param {Object} name - The name of the contents.
				 * @param {Object} description - The description of the contents.
				 * @param {Object} version - The version of the contents.
				 * @return {Object} - The base contents object.
				 */
				baseContents: ({ name, description, version }) => ({
					name,
					description,
					version,
					main: 'index.js'
				})
			})
		]
	},
	// jsx-runtime包
	{
		input: `${pkgPath}/src/jsx.ts`,
		output: [
			{
				file: `${pkgDistPath}/jsx-runtime.js`,
				name: 'jsx-runtime',
				format: 'umd'
			},
			{
				file: `${pkgDistPath}/jsx-dev-runtime.js`,
				name: 'jsx-dev-runtime',
				format: 'umd'
			}
		],
		plugins: getBaseRollupPlugins()
	}
];
