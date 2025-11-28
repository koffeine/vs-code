import koffeine from '@koffeine/eslint-config';
import globals from 'globals';

/** @type {import('eslint').Linter.Config[]} */
export default [
	...koffeine,
	{
		languageOptions: {
			globals: globals.node
		}
	}
];
