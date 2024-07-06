import {
	NodeOperationError,
	type IExecuteFunctions,
	type INodeExecutionData,
	type INodeType,
	type INodeTypeDescription,
} from 'n8n-workflow';
import {
	type Aggregations,
	NUMERICAL_AGGREGATIONS,
	type SummarizeOptions,
	aggregationToArray,
	checkIfFieldExists,
	fieldValueGetter,
	splitData,
} from './utils';
import { generatePairedItemData } from '../../../utils/utilities';

export class Summarize implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Summarize',
		name: 'summarize',
		icon: 'file:summarize.svg',
		group: ['transform'],
		subtitle: '',
		version: 1,
		description: '对项目进行求和、计数、最大值等操作',
		defaults: {
			name: 'Summarize',
		},
		inputs: ['main'],
		outputs: ['main'],
		properties: [
			{
				displayName: '需要聚合的字段',
				name: 'fieldsToSummarize',
				type: 'fixedCollection',
				placeholder: 'Add Field',
				default: { values: [{ aggregation: 'count', field: '' }] },
				typeOptions: {
					multipleValues: true,
				},
				options: [
					{
						"displayName": "",
						"name": "values",
						"values": [
							{
								"displayName": "聚合方式",
								"name": "aggregation",
								"type": "options",
								"options": [
									{
										"name": "追加",
										"value": "append"
									},
									{
										"name": "平均值",
										"value": "average"
									},
									{
										"name": "连接",
										"value": "concatenate"
									},
									{
										"name": "计数",
										"value": "count"
									},
									{
										"name": "唯一计数",
										"value": "countUnique"
									},
									{
										"name": "最大值",
										"value": "max"
									},
									{
										"name": "最小值",
										"value": "min"
									},
									{
										"name": "求和",
										"value": "sum"
									}
								],
								"default": "count",
								"description": "用于合并要汇总字段的值的方式"
							},
							// 重复字段以适应不同的聚合方式 --------------------------------
							{
								"displayName": "字段名",
								"name": "field",
								"type": "string",
								"default": "",
								"description": "要汇总的输入字段的名称",
								"placeholder": "例如，成本",
								"hint": "输入字段名称作为文本",
								"displayOptions": {
									"hide": {
										"aggregation": [...NUMERICAL_AGGREGATIONS, 'countUnique', 'count', 'max', 'min']
									}
								},
								"requiresDataPath": "single"
							},
							{
								"displayName": "字段名",
								"name": "field",
								"type": "string",
								"default": "",
								"description": "要汇总的输入字段的名称。字段应包含数字值；null、undefined、空字符串将被忽略。",
								"placeholder": "例如，成本",
								"hint": "输入字段名称作为文本",
								"displayOptions": {
									"show": {
										"aggregation": NUMERICAL_AGGREGATIONS
									}
								},
								"requiresDataPath": "single"
							},
							{
								"displayName": "字段名",
								"name": "field",
								"type": "string",
								"default": "",
								"description": "要汇总的输入字段的名称；null、undefined、空字符串将被忽略",
								"placeholder": "例如，成本",
								"hint": "输入字段名称作为文本",
								"displayOptions": {
									"show": {
										"aggregation": ['countUnique', 'count', 'max', 'min']
									}
								},
								"requiresDataPath": "single"
							},
							// ----------------------------------------------------------------------------------------------------------
							{
								"displayName": "包含空值",
								"name": "includeEmpty",
								"type": "boolean",
								"default": false,
								"displayOptions": {
									"show": {
										"aggregation": ['append', 'concatenate']
									}
								}
							},
							{
								"displayName": "分隔符",
								"name": "separateBy",
								"type": "options",
								"default": ",",
								"options": [
									{
										"name": "逗号",
										"value": ","
									},
									{
										"name": "逗号和空格",
										"value": ", "
									},
									{
										"name": "换行",
										"value": "\n"
									},
									{
										"name": "无",
										"value": ""
									},
									{
										"name": "空格",
										"value": " "
									},
									{
										"name": "其他",
										"value": "other"
									}
								],
								"hint": "值之间插入的内容",
								"displayOptions": {
									"show": {
										"aggregation": ['concatenate']
									}
								}
							},
							{
								"displayName": "自定义分隔符",
								"name": "customSeparator",
								"type": "string",
								"default": "",
								"displayOptions": {
									"show": {
										"aggregation": ['concatenate'],
										"separateBy": ['other']
									}
								}
							}
						]
					}

				],
			},
			// fieldsToSplitBy repeated to have different displayName for singleItem and separateItems -----------------------------
			{
				"displayName": "按哪些字段拆分",
				"name": "fieldsToSplitBy",
				"type": "string",
				"placeholder": "例如，国家，城市",
				"default": "",
				"description": "您想要按哪些输入字段拆分摘要的名称",
				"hint": "将字段名称作为文本输入（用逗号分隔）",
				"displayOptions": {
					"hide": {
						"/options.outputFormat": ["singleItem"]
					}
				},
				"requiresDataPath": "multiple"
			},
			{
				"displayName": "按哪些字段分组",
				"name": "fieldsToGroupBy",
				"type": "string",
				"placeholder": "例如，国家，城市",
				"default": "",
				"description": "您想要按哪些输入字段分组摘要的名称",
				"hint": "将字段名称作为文本输入（用逗号分隔）",
				"displayOptions": {
					"show": {
						"/options.outputFormat": ["singleItem"]
					}
				},
				"requiresDataPath": "multiple"
			},

			// ----------------------------------------------------------------------------------------------------------
			{
				"displayName": "选项",
				"name": "options",
				"type": "collection",
				"placeholder": "添加选项",
				"default": {},
				"options": [
					{
						"displayName": "如果找不到字段则继续",
						"name": "continueIfFieldNotFound",
						"type": "boolean",
						"default": false,
						"description": "如果要汇总的字段在任何条目中都找不到，则是否继续并返回单个空条目，否则会抛出错误"
					},
					{
						"displayName": "禁用点符号表示法",
						"name": "disableDotNotation",
						"type": "boolean",
						"default": false,
						"description": "是否禁止使用 `parent.child` 形式来引用子字段"
					},
					{
						"displayName": "输出格式",
						"name": "outputFormat",
						"type": "options",
						"default": "separateItems",
						"options": [
							{
								"name": "每个拆分为单独的条目",
								"value": "separateItems"
							},
							{
								"name": "所有拆分为单个条目",
								"value": "singleItem"
							}
						]
					},
					{
						"displayName": "忽略没有有效拆分字段的条目",
						"name": "skipEmptySplitFields",
						"type": "boolean",
						"default": false
					}
				]
			}

		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const newItems = items.map(({ json }, i) => ({ ...json, _itemIndex: i }));

		const options = this.getNodeParameter('options', 0, {}) as SummarizeOptions;

		const fieldsToSplitBy = (this.getNodeParameter('fieldsToSplitBy', 0, '') as string)
			.split(',')
			.map((field) => field.trim())
			.filter((field) => field);

		const fieldsToSummarize = this.getNodeParameter(
			'fieldsToSummarize.values',
			0,
			[],
		) as Aggregations;

		if (fieldsToSummarize.filter((aggregation) => aggregation.field !== '').length === 0) {
			throw new NodeOperationError(
				this.getNode(),
				"You need to add at least one aggregation to 'Fields to Summarize' with non empty 'Field'",
			);
		}

		const getValue = fieldValueGetter(options.disableDotNotation);

		const nodeVersion = this.getNode().typeVersion;

		if (nodeVersion < 2.1) {
			try {
				checkIfFieldExists.call(this, newItems, fieldsToSummarize, getValue);
			} catch (error) {
				if (options.continueIfFieldNotFound) {
					const itemData = generatePairedItemData(items.length);

					return [[{ json: {}, pairedItem: itemData }]];
				} else {
					throw error;
				}
			}
		}

		const aggregationResult = splitData(
			fieldsToSplitBy,
			newItems,
			fieldsToSummarize,
			options,
			getValue,
		);

		if (options.outputFormat === 'singleItem') {
			const executionData: INodeExecutionData = {
				json: aggregationResult,
				pairedItem: newItems.map((_v, index) => ({
					item: index,
				})),
			};
			return [[executionData]];
		} else {
			if (!fieldsToSplitBy.length) {
				const { pairedItems, ...json } = aggregationResult;
				const executionData: INodeExecutionData = {
					json,
					pairedItem: ((pairedItems as number[]) || []).map((index: number) => ({
						item: index,
					})),
				};
				return [[executionData]];
			}
			const returnData = aggregationToArray(aggregationResult, fieldsToSplitBy);
			const executionData = returnData.map((item) => {
				const { pairedItems, ...json } = item;
				return {
					json,
					pairedItem: ((pairedItems as number[]) || []).map((index: number) => ({
						item: index,
					})),
				};
			});
			return [executionData];
		}
	}
}
