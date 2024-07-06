import type {
	IExecuteFunctions,
	IDataObject,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import {
	checkInput,
	checkInputAndThrowError,
	checkMatchFieldsInput,
	findMatches,
} from './GenericFunctions';

export class CompareDatasets implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Compare Datasets',
		name: 'compareDatasets',
		icon: 'file:compare.svg',
		group: ['transform'],
		version: [1, 2, 2.1, 2.2, 2.3],
		"description": "比较两个输入",
		defaults: { name: 'Compare Datasets' },
		// eslint-disable-next-line n8n-nodes-base/node-class-description-inputs-wrong-regular-node
		inputs: ['main', 'main'],
		inputNames: ['Input A', 'Input B'],
		requiredInputs: 1,
		// eslint-disable-next-line n8n-nodes-base/node-class-description-outputs-wrong
		outputs: ['main', 'main', 'main', 'main'],
		outputNames: ['In A only', 'Same', 'Different', 'In B only'],
		properties: [
			{
				"displayName": "当下面的字段匹配时，来自不同分支的项目将配对在一起。如果配对，则将比较其余字段以确定项目是相同还是不同。",
				name: 'infoBox',
				type: 'notice',
				default: '',
			},
			{
				"displayName": "要匹配的字段",
				name: 'mergeByFields',
				type: 'fixedCollection',
				"placeholder": "添加要匹配的字段",
				default: { values: [{ field1: '', field2: '' }] },
				typeOptions: {
					multipleValues: true,
				},
				options: [
					{
						displayName: '值',
						name: 'values',
						values: [
							{
								"displayName": "输入 A 字段",
								name: 'field1',
								type: 'string',
								default: '',
								// eslint-disable-next-line n8n-nodes-base/node-param-placeholder-miscased-id
								"placeholder": "例如 id",
								"hint": " 以文本形式输入字段名称",
								requiresDataPath: 'single',
							},
							{
								"displayName": "输入 B 字段",
								name: 'field2',
								type: 'string',
								default: '',
								// eslint-disable-next-line n8n-nodes-base/node-param-placeholder-miscased-id
								"placeholder": "例如 id",
								"hint": " 以文本形式输入字段名称",
								requiresDataPath: 'single',
							},
						],
					},
				],
			},
			{
				"displayName": "存在差异时",
				"name": "resolve",
				"type": "options",
				"default": "preferInput2",
				"options": [
					{
						"name": "使用输入 A 版本",
						"value": "preferInput1"
					},
					{
						"name": "使用输入 B 版本",
						"value": "preferInput2"
					},
					{
						"name": "使用版本混合",
						"value": "mix",
						"description": "输出对不同字段使用不同的输入"
					},
					{
						"name": "包括两个版本",
						"value": "includeBoth",
						"description": "输出包含所有数据（但结构更复杂）"
					}
				],
				"displayOptions": {
					"show": {
						"@version": [1, 2]
					}
				}
			},
			{
				"displayName": "存在差异时",
				"name": "resolve",
				"type": "options",
				"default": "includeBoth",
				"options": [
					{
						"name": "使用输入 A 版本",
						"value": "preferInput1"
					},
					{
						"name": "使用输入 B 版本",
						"value": "preferInput2"
					},
					{
						"name": "使用版本混合",
						"value": "mix",
						"description": "输出对不同字段使用不同的输入"
					},
					{
						"name": "包括两个版本",
						"value": "includeBoth",
						"description": "输出包含所有数据（但结构更复杂）"
					}
				],
				"displayOptions": {
					"hide": {
						"@version": [1, 2]
					}
				}
			},

			{
				"displayName": "模糊比较",
				"name": "fuzzyCompare",
				"type": "boolean",
				"default": false,
				"description": "在比较字段时是否容忍小的类型差异。例如，数字 3 和字符串 '3' 被视为相同。",
				"displayOptions": {
					"hide": {
						"@version": [1]
					}
				}
			},
			{
				"displayName": "首选",
				"name": "preferWhenMix",
				"type": "options",
				"default": "input1",
				"options": [
					{
						"name": "输入 A 版本",
						"value": "input1"
					},
					{
						"name": "输入 B 版本",
						"value": "input2"
					}
				],
				"displayOptions": {
					"show": {
						"resolve": ["mix"]
					}
				}
			},
			{
				"displayName": "除外",
				"name": "exceptWhenMix",
				"type": "string",
				"default": "",
				"placeholder": "例如 id, country",
				"hint": "以文本形式输入输入字段的名称，用逗号分隔",
				"displayOptions": {
					"show": {
						"resolve": ["mix"]
					}
				},
				"requiresDataPath": "multiple"
			},
			{
				"displayName": "选项",
				"name": "options",
				"type": "collection",
				"placeholder": "添加选项",
				"default": {},
				"options": [
					{
						"displayName": "跳过比较的字段",
						"name": "skipFields",
						"type": "string",
						"default": "",
						"placeholder": "例如 updated_at, updated_by",
						"hint": "以文本形式输入字段名称，用逗号分隔",
						"description": "在检查两个项目是否相同时不应包含的字段",
						"requiresDataPath": "multiple"
					},
					{
						"displayName": "模糊比较",
						"name": "fuzzyCompare",
						"type": "boolean",
						"default": false,
						"description": "在比较字段时是否容忍小的类型差异。例如，数字 3 和字符串 '3' 被视为相同。",
						"displayOptions": {
							"show": {
								"@version": [1]
							}
						}
					},
					{
						"displayName": "禁用点表示法",
						"name": "disableDotNotation",
						"type": "boolean",
						"default": false,
						"description": "是否禁止使用 `parent.child` 的点表示法引用子字段"
					},
					{
						"displayName": "多个匹配",
						"name": "multipleMatches",
						"type": "options",
						"default": "first",
						"options": [
							{
								"name": "仅包含第一个匹配",
								"value": "first",
								"description": "如果存在多个匹配，只输出一个项目"
							},
							{
								"name": "包含所有匹配",
								"value": "all",
								"description": "如果存在多个匹配，输出多个项目"
							}
						]
					}
				]
			}
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const matchFields = checkMatchFieldsInput(
			this.getNodeParameter('mergeByFields.values', 0, []) as IDataObject[],
		);

		const options = this.getNodeParameter('options', 0, {});

		options.nodeVersion = this.getNode().typeVersion;

		if (options.nodeVersion >= 2) {
			options.fuzzyCompare = this.getNodeParameter('fuzzyCompare', 0, false) as boolean;
		}

		let input1 = this.getInputData(0);
		let input2 = this.getInputData(1);
		if (options.nodeVersion < 2.2) {
			input1 = checkInputAndThrowError(
				input1,
				matchFields.map((pair) => pair.field1),
				(options.disableDotNotation as boolean) || false,
				'Input A',
			);

			input2 = checkInputAndThrowError(
				input2,
				matchFields.map((pair) => pair.field2),
				(options.disableDotNotation as boolean) || false,
				'Input B',
			);
		} else {
			input1 = checkInput(input1);
			input2 = checkInput(input2);
		}

		const resolve = this.getNodeParameter('resolve', 0, '') as string;
		options.resolve = resolve;

		if (resolve === 'mix') {
			options.preferWhenMix = this.getNodeParameter('preferWhenMix', 0, '') as string;
			options.exceptWhenMix = this.getNodeParameter('exceptWhenMix', 0, '') as string;
		}

		const matches = findMatches(input1, input2, matchFields, options);

		return matches;
	}
}
