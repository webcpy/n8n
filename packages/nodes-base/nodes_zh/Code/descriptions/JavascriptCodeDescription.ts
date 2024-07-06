import type { INodeProperties } from 'n8n-workflow';

const commonDescription: INodeProperties = {
	displayName: 'JavaScript',
	name: 'jsCode',
	type: 'string',
	typeOptions: {
		editor: 'codeNodeEditor',
		editorLanguage: 'javaScript',
	},
	default: '',
	"description": "要执行的 JavaScript 代码。<br><br>提示：您可以使用 luxon 变量，如 <code>$today</code> 用于日期和 <code>$jmespath</code> 用于查询 JSON 结构。<a href=\"https://docs.n8n.io/nodes/n8n-nodes-base.function\">了解更多</a>。",
	noDataExpression: true,
};

const v1Properties: INodeProperties[] = [
	{
		...commonDescription,
		displayOptions: {
			show: {
				'@version': [1],
				mode: ['runOnceForAllItems'],
			},
		},
	},
	{
		...commonDescription,
		displayOptions: {
			show: {
				'@version': [1],
				mode: ['runOnceForEachItem'],
			},
		},
	},
];

const v2Properties: INodeProperties[] = [
	{
		...commonDescription,
		displayOptions: {
			show: {
				'@version': [2],
				language: ['javaScript'],
				mode: ['runOnceForAllItems'],
			},
		},
	},
	{
		...commonDescription,
		displayOptions: {
			show: {
				'@version': [2],
				language: ['javaScript'],
				mode: ['runOnceForEachItem'],
			},
		},
	},
];

export const javascriptCodeDescription: INodeProperties[] = [
	...v1Properties,
	...v2Properties,
	{
		"displayName": "在浏览器控制台中使用<code>print()</code>语句进行调试，查看其输出。",
		name: 'notice',
		type: 'notice',
		displayOptions: {
			show: {
				language: ['javaScript'],
			},
		},
		default: '',
	},
];
