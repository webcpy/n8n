import type {
	IDataObject,
	IExecuteFunctions,
	ILoadOptionsFunctions,
	INodeExecutionData,
	INodeParameters,
	INodePropertyOptions,
	INodeType,
	INodeTypeBaseDescription,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionType, NodeOperationError } from 'n8n-workflow';
import set from 'lodash/set';
import { capitalize } from '@utils/utilities';

const configuredOutputs = (parameters: INodeParameters) => {
	const mode = parameters.mode as string;

	if (mode === 'expression') {
		return Array.from({ length: parameters.numberOutputs as number }, (_, i) => ({
			type: `${NodeConnectionType.Main}`,
			displayName: i.toString(),
		}));
	} else {
		const rules = ((parameters.rules as IDataObject)?.values as IDataObject[]) ?? [];
		const ruleOutputs = rules.map((rule, index) => {
			return {
				type: `${NodeConnectionType.Main}`,
				displayName: rule.outputKey || index.toString(),
			};
		});
		if ((parameters.options as IDataObject)?.fallbackOutput === 'extra') {
			const renameFallbackOutput = (parameters.options as IDataObject)?.renameFallbackOutput;
			ruleOutputs.push({
				type: `${NodeConnectionType.Main}`,
				displayName: renameFallbackOutput || 'Fallback',
			});
		}
		return ruleOutputs;
	}
};

export class SwitchV3 implements INodeType {
	description: INodeTypeDescription;

	constructor(baseDescription: INodeTypeBaseDescription) {
		this.description = {
			...baseDescription,
			subtitle: `=mode: {{(${capitalize})($parameter["mode"])}}`,
			version: [3],
			defaults: {
				name: 'Switch',
				color: '#506000',
			},
			inputs: ['main'],
			outputs: `={{(${configuredOutputs})($parameter)}}`,
			properties: [
				{
					displayName: '模式',
					"name": "mode",
					"type": "options",
					"noDataExpression": true,
					"options": [
						{
							"name": "规则",
							"value": "rules",
							"description": "为每个输出构建匹配规则"
						},
						{
							"name": "表达式",
							"value": "expression",
							"description": "编写一个表达式来返回输出索引"
						}
					],
					"default": "rules",
					"description": "数据应该如何路由"
				},
				{
					"displayName": "输出数量",
					"name": "numberOutputs",
					"type": "number",
					"displayOptions": {
						"show": {
							"mode": ["expression"]
						}
					},
					"default": 4,
					"description": "要创建多少个输出"
				},
				{
					"displayName": "输出索引",
					"name": "output",
					"type": "number",
					"validateType": "number",
					"hint": "要路由到的索引，从0开始",
					"displayOptions": {
						"show": {
							"mode": ["expression"]
						}
					},
					"default": "={{}}",
					"description": "将输入项发送到的输出索引。使用表达式计算应将哪个输入项路由到哪个输出。表达式必须返回一个数字。"
				},
				{
					"displayName": "路由规则",
					"name": "rules",
					"placeholder": "添加路由规则",
					"type": "fixedCollection",
					"typeOptions": {
						"multipleValues": true,
						"sortable": true
					},
					"default": {
						"values": [
							{
								"conditions": {
									"options": {
										"caseSensitive": true,
										"leftValue": "",
										"typeValidation": "strict"
									},
									"conditions": [
										{
											"leftValue": "",
											"rightValue": "",
											"operator": {
												"type": "string",
												"operation": "equals"
											}
										}
									],
									"combinator": "and"
								}
							}
						]
					},
					"displayOptions": {
						"show": {
							"mode": ["rules"]
						}
					},
					"options": [
						{
							"name": "values",
							"displayName": "值",
							"values": [
								{
									"displayName": "条件",
									"name": "conditions",
									"placeholder": "添加条件",
									"type": "filter",
									"default": {},
									"typeOptions": {
										"multipleValues": false,
										"filter": {
											"caseSensitive": "={{!$parameter.options.ignoreCase}}",
											"typeValidation": "={{$parameter.options.looseTypeValidation ? 'loose' : 'strict'}}"
										}
									}
								},
								{
									"displayName": "重命名输出",
									"name": "renameOutput",
									"type": "boolean",
									"default": false
								},
								{
									"displayName": "输出名称",
									"name": "outputKey",
									"type": "string",
									"default": "",
									"description": "如果规则匹配，则要发送数据的输出标签",
									"displayOptions": {
										"show": {
											"renameOutput": [true]
										}
									}
								}
							]
						}
					]
				},

				{
					"displayName": "选项",
					"name": "options",
					"type": "collection",
					"placeholder": "添加选项",
					"default": {},
					"displayOptions": {
						"show": {
							"mode": ["rules"]
						}
					},
					"options": [
						{
							"displayName": "备用输出",
							"name": "fallbackOutput",
							"type": "options",
							"typeOptions": {
								"loadOptionsDependsOn": ["rules.values", "/rules", "/rules.values"],
								"loadOptionsMethod": "getFallbackOutputOptions"
							},
							"default": "none",
							"description": "如果没有规则匹配，则将项发送到此输出，默认情况下它们将被忽略"
						},
						{
							"displayName": "忽略大小写",
							"description": "在评估条件时是否忽略字母大小写",
							"name": "ignoreCase",
							"type": "boolean",
							"default": true
						},
						{
							"displayName": "类型验证宽松一些",
							"description": "是否根据所选运算符尝试转换数值类型。",
							"name": "looseTypeValidation",
							"type": "boolean",
							"default": true
						},

						{
							"displayName": "重命名备用输出",
							"name": "renameFallbackOutput",
							"type": "string",
							"placeholder": "例如：回退",
							"default": "",
							"displayOptions": {
								"show": {
									"fallbackOutput": ["extra"]
								}
							}
						},
						{
							"displayName": "发送数据到所有匹配的输出",
							"name": "allMatchingOutputs",
							"type": "boolean",
							"default": false,
							"description": "是否将数据发送到满足条件的所有输出（而不仅仅是第一个）"
						}
					]
				}

			],
		};
	}

	methods = {
		loadOptions: {
			async getFallbackOutputOptions(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const rules = (this.getCurrentNodeParameter('rules.values') as INodeParameters[]) ?? [];

				const outputOptions: INodePropertyOptions[] = [
					{
						// eslint-disable-next-line n8n-nodes-base/node-param-display-name-miscased
						name: 'None (default)',
						value: 'none',
						description: 'Items will be ignored',
					},
					{
						name: 'Extra Output',
						value: 'extra',
						description: 'Items will be sent to the extra, separate, output',
					},
				];

				for (const [index, rule] of rules.entries()) {
					outputOptions.push({
						name: `Output ${rule.outputKey || index}`,
						value: index,
						description: `Items will be sent to the same output as when matched rule ${index + 1}`,
					});
				}

				return outputOptions;
			},
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		let returnData: INodeExecutionData[][] = [];

		const items = this.getInputData();
		const mode = this.getNodeParameter('mode', 0) as string;

		const checkIndexRange = (returnDataLength: number, index: number, itemIndex = 0) => {
			if (Number(index) === returnDataLength) {
				throw new NodeOperationError(this.getNode(), `The ouput ${index} is not allowed. `, {
					itemIndex,
					description: `Output indexes are zero based, if you want to use the extra output use ${index - 1
						}`,
				});
			}
			if (index < 0 || index > returnDataLength) {
				throw new NodeOperationError(this.getNode(), `The ouput ${index} is not allowed`, {
					itemIndex,
					description: `It has to be between 0 and ${returnDataLength - 1}`,
				});
			}
		};

		itemLoop: for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				const item = items[itemIndex];

				item.pairedItem = { item: itemIndex };

				if (mode === 'expression') {
					const numberOutputs = this.getNodeParameter('numberOutputs', itemIndex) as number;
					if (itemIndex === 0) {
						returnData = new Array(numberOutputs).fill(0).map(() => []);
					}
					const outputIndex = this.getNodeParameter('output', itemIndex) as number;
					checkIndexRange(returnData.length, outputIndex, itemIndex);

					returnData[outputIndex].push(item);
				} else if (mode === 'rules') {
					const rules = this.getNodeParameter('rules.values', itemIndex, []) as INodeParameters[];
					if (!rules.length) continue;
					const options = this.getNodeParameter('options', itemIndex, {});
					const fallbackOutput = options.fallbackOutput;

					if (itemIndex === 0) {
						returnData = new Array(rules.length).fill(0).map(() => []);

						if (fallbackOutput === 'extra') {
							returnData.push([]);
						}
					}

					let matchFound = false;
					for (const [ruleIndex, rule] of rules.entries()) {
						let conditionPass;

						try {
							conditionPass = this.getNodeParameter(
								`rules.values[${ruleIndex}].conditions`,
								itemIndex,
								false,
								{
									extractValue: true,
								},
							) as boolean;
						} catch (error) {
							if (!options.looseTypeValidation) {
								error.description =
									"Try changing the type of comparison. Alternatively you can enable 'Less Strict Type Validation' in the options.";
							}
							set(error, 'context.itemIndex', itemIndex);
							set(error, 'node', this.getNode());
							throw error;
						}

						if (conditionPass) {
							matchFound = true;
							checkIndexRange(returnData.length, rule.output as number, itemIndex);
							returnData[ruleIndex].push(item);

							if (!options.allMatchingOutputs) {
								continue itemLoop;
							}
						}
					}

					if (fallbackOutput !== undefined && fallbackOutput !== 'none' && !matchFound) {
						if (fallbackOutput === 'extra') {
							returnData[returnData.length - 1].push(item);
							continue;
						}
						checkIndexRange(returnData.length, fallbackOutput as number, itemIndex);
						returnData[fallbackOutput as number].push(item);
					}
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData[0].push({ json: { error: error.message } });
					continue;
				}
				throw new NodeOperationError(this.getNode(), error);
			}
		}

		if (!returnData.length) return [[]];

		return returnData;
	}
}
