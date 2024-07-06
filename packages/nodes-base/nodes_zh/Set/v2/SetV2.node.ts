/* eslint-disable n8n-nodes-base/node-filename-against-convention */
import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeBaseDescription,
	INodeTypeDescription,
} from 'n8n-workflow';

import type { IncludeMods, SetField, SetNodeOptions } from './helpers/interfaces';
import { INCLUDE } from './helpers/interfaces';

import * as raw from './raw.mode';
import * as manual from './manual.mode';

type Mode = 'manual' | 'raw';

const versionDescription: INodeTypeDescription = {
	displayName: 'Edit Fields (Set)',
	name: 'set',
	icon: 'fa:pen',
	group: ['input'],
	version: [3, 3.1, 3.2, 3.3],
	description: '添加或编辑输入项中的字段，并可选择删除其他字段',
	subtitle: '={{$parameter["mode"]}}',
	defaults: {
		name: 'Edit Fields',
		color: '#0000FF',
	},
	inputs: ['main'],
	outputs: ['main'],
	properties: [
		{
			"displayName": "模式",
			"name": "mode",
			"type": "options",
			"noDataExpression": true,
			"options": [
				{
					"name": "手动映射",
					"value": "manual",
					"description": "逐个编辑项目字段",
					"action": "逐个编辑项目字段"
				},
				{
					"name": "JSON",
					"value": "raw",
					"description": "使用JSON自定义项目输出",
					"action": "使用JSON自定义项目输出"
				}
			],
			"default": "manual"
		},
		{
			"displayName": "复制项目",
			"name": "duplicateItem",
			"type": "boolean",
			"default": false,
			"isNodeSetting": true
		},
		{
			"displayName": "复制项目计数",
			"name": "duplicateCount",
			"type": "number",
			"default": 0,
			"typeOptions": {
				"minValue": 0
			},
			"description": "项目应该被复制的次数，主要用于测试和调试",
			"isNodeSetting": true,
			"displayOptions": {
				"show": {
					"duplicateItem": [true]
				}
			}
		},
		{
			"displayName": "项目复制已在节点设置中设置。当工作流自动运行时，此选项将被忽略。",
			"name": "duplicateWarning",
			"type": "notice",
			"default": "",
			"displayOptions": {
				"show": {
					"duplicateItem": [true]
				}
			}
		},
		...raw.description,
		...manual.description,
		{
			"displayName": "包含在输出中",
			"name": "include",
			"type": "options",
			"description": "选择要包含在输出项中的字段的方式",
			"default": "all",
			"displayOptions": {
				"show": {
					"@version": [3, 3.1, 3.2]
				}
			},
			"options": [
				{
					"name": "所有输入字段",
					"value": "all",
					"description": "同时包含输入中所有未更改的字段"
				},
				{
					"name": "无输入字段",
					"value": "none",
					"description": "仅包含上述指定的字段"
				},
				{
					"name": "已选择的输入字段",
					"value": "selected",
					"description": "同时包含参数“要包含的字段”中列出的字段"
				},
				{
					"name": "除了所有输入字段",
					"value": "except",
					"description": "排除参数“要排除的字段”中列出的字段"
				}
			]
		},
		{
			"displayName": "包含其他输入字段",
			"name": "includeOtherFields",
			"type": "boolean",
			"default": false,
			"description": "是否将所有输入字段（以及“要设置的字段”中设置的字段）传递到输出",
			"displayOptions": {
				"hide": {
					"@version": [3, 3.1, 3.2]
				}
			}
		},
		{
			"displayName": "要包含的输入字段",
			"name": "include",
			"type": "options",
			"description": "选择要包含在输出项中的字段的方式",
			"default": "all",
			"displayOptions": {
				"hide": {
					"@version": [3, 3.1, 3.2],
					"/includeOtherFields": [false]
				}
			},
			"options": [
				{
					"name": "所有",
					"value": "all",
					"description": "同时包含输入中所有未更改的字段"
				},
				{
					"name": "已选择",
					"value": "selected",
					"description": "同时包含参数“要包含的字段”中列出的字段"
				},
				{
					"name": "除了所有",
					"value": "except",
					"description": "排除参数“要排除的字段”中列出的字段"
				}
			]
		},
		{
			"displayName": "要包含的字段",
			"name": "includeFields",
			"type": "string",
			"default": "",
			"placeholder": "例如 fieldToInclude1,fieldToInclude2",
			"description": "要包含在输出中的字段名称的逗号分隔列表。您可以从输入面板拖动所选字段。",
			"requiresDataPath": "multiple",
			"displayOptions": {
				"show": {
					"include": ["selected"]
				}
			}
		},
		{
			"displayName": "要排除的字段",
			"name": "excludeFields",
			"type": "string",
			"default": "",
			"placeholder": "例如 fieldToExclude1,fieldToExclude2",
			"description": "要从输出中排除的字段名称的逗号分隔列表。您可以从输入面板拖动所选字段。",
			"requiresDataPath": "multiple",
			"displayOptions": {
				"show": {
					"include": ["except"]
				}
			}
		},
		{
			"displayName": "选项",
			"name": "options",
			"type": "collection",
			"placeholder": "添加选项",
			"default": {},
			"options": [
				{
					"displayName": "包含二进制文件",
					"name": "includeBinary",
					"type": "boolean",
					"default": true,
					"description": "是否应包含二进制数据（如果存在）"
				},
				{
					"displayName": "忽略类型转换错误",
					"name": "ignoreConversionErrors",
					"type": "boolean",
					"default": false,
					"description": "是否忽略字段类型错误并应用较少严格的类型转换",
					"displayOptions": {
						"show": {
							"/mode": ["manual"]
						}
					}
				},
				{
					"displayName": "支持点符号表示法",
					"name": "dotNotation",
					"type": "boolean",
					"default": true,
					"description": "默认情况下，属性名称使用点符号表示法。这意味着\"a.b\"将设置\"a\"下的\"b\"属性，因此{ \"a\": { \"b\": value} }。如果这不是预期的行为，可以将其取消激活，它将设置{ \"a.b\": value }。"
				}
			]
		},
	],
};

export class SetV2 implements INodeType {
	description: INodeTypeDescription;

	constructor(baseDescription: INodeTypeBaseDescription) {
		this.description = {
			...baseDescription,
			...versionDescription,
		};
	}

	async execute(this: IExecuteFunctions) {
		const items = this.getInputData();
		const mode = this.getNodeParameter('mode', 0) as Mode;
		const duplicateItem = this.getNodeParameter('duplicateItem', 0, false) as boolean;

		const setNode = { raw, manual };

		const returnData: INodeExecutionData[] = [];

		const rawData: IDataObject = {};

		if (mode === 'raw') {
			const jsonOutput = this.getNodeParameter('jsonOutput', 0, '', {
				rawExpressions: true,
			}) as string | undefined;

			if (jsonOutput?.startsWith('=')) {
				rawData.jsonOutput = jsonOutput.replace(/^=+/, '');
			}
		} else {
			const workflowFieldsJson = this.getNodeParameter('fields.values', 0, [], {
				rawExpressions: true,
			}) as SetField[];

			for (const entry of workflowFieldsJson) {
				if (entry.type === 'objectValue' && (entry.objectValue as string).startsWith('=')) {
					rawData[entry.name] = (entry.objectValue as string).replace(/^=+/, '');
				}
			}
		}

		for (let i = 0; i < items.length; i++) {
			const includeOtherFields = this.getNodeParameter('includeOtherFields', i, false) as boolean;
			const include = this.getNodeParameter('include', i, 'all') as IncludeMods;
			const options = this.getNodeParameter('options', i, {});
			const node = this.getNode();

			if (node.typeVersion >= 3.3) {
				options.include = includeOtherFields ? include : 'none';
			} else {
				options.include = include;
			}

			const newItem = await setNode[mode].execute.call(
				this,
				items[i],
				i,
				options as SetNodeOptions,
				rawData,
				node,
			);

			if (duplicateItem && this.getMode() === 'manual') {
				const duplicateCount = this.getNodeParameter('duplicateCount', 0, 0) as number;
				for (let j = 0; j <= duplicateCount; j++) {
					returnData.push(newItem);
				}
			} else {
				returnData.push(newItem);
			}
		}

		return [returnData];
	}
}
