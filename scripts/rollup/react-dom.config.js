import generatePackageJSON from 'rollup-plugin-generate-package-json';
import alias from '@rollup/plugin-alias';
import {
	getPackageJSON,
	resolvePackagePaths,
	getBaseRollupPlugins
} from './utils';

const { name, module, description, version, peerDependencies } =
	getPackageJSON('react-dom');
// 包的路径
const pkgPath = resolvePackagePaths(name, false);
// 产物的路径
const pkgDistPath = resolvePackagePaths(name, true);

export default [
	// react-dom包
	{
		input: `${pkgPath}/${module}`,
		output: [
			{
				file: `${pkgDistPath}/index.js`,
				name: 'ReactDOM',
				format: 'umd'
			},
			{
				file: `${pkgDistPath}/client.js`,
				name: 'client',
				format: 'umd'
			}
		],
		external: [...Object.keys(peerDependencies)],
		plugins: [
			...getBaseRollupPlugins(),
			// 需要一个类似webpack中的resolve alias功能
			alias({
				entries: {
					hostConfig: `${pkgPath}/src/host-config.js`
				}
			}),
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
					peerDependencies: {
						react: version
					},
					main: 'index.js'
				})
			})
		]
	},
	// react-test-utils包
	{
		input: `${pkgPath}/test-utils.ts`,
		output: [
			{
				file: `${pkgDistPath}/test-utils.js`,
				name: 'testUtils',
				format: 'umd'
			}
		],
		external: ['react-dom', 'react'],
		plugins: getBaseRollupPlugins()
	}
];
