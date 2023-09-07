module.exports = {
	useEmoji: true,
	skipQuestions: ['footerPrefix', 'footer', 'confirmCommit'],
	types: [
		{
			value: 'chore',
			name: "chore: 🤷 If you don't know the type will select",
			emoji: ':shrug:',
		},
		{
			value: 'perf',
			name: 'perf: ⚡️ Improve perfomance',
			emoji: ':zap:',
		},
		{
			value: 'release',
			name: 'release: 🎯 Create a release commit',
			emoji: ':dart:',
		},
		{
			value: 'docs',
			name: 'docs: 🗒 Create / change some document files (ex: *.docs, *.md)',
			emoji: ':spiral_notepad:',
		},
		{
			value: 'test',
			name: 'test: 🔬 Add / change a test',
			emoji: ':microscope:',
		},
		{
			value: 'style',
			name: 'style: 🎨 Only style for layout',
			emoji: ':art:',
		},
		{
			value: 'fix',
			name: 'fix: 🐞 Fix a bug',
			emoji: ':lady_beetle:',
		},
		{
			value: 'feat',
			name: 'feat: 🧩 Create a new feature',
			emoji: ':jigsaw:',
		},
		{
			value: 'update',
			name: 'update: 🧩 Update but not improve performance',
			emoji: ':jigsaw:',
		},
	],
	scopes: [
		'page',
		'comp-page',
		'comp-glob',
		'lib',
		'util',
		'enum',
		'define',
		'server',
		'other',
	],
	messages: {
		type: 'Select the type of committing:',
		customScope: 'Select the scope this component affects:',
		subject: 'Title:\n',
		body: 'Description:\n',
		breaking: 'List any breaking changes:\n',
		footer: 'Issues this commit closes, e.g #123:',
		confirmCommit: 'Ready to commit ?\n',
	},
}
