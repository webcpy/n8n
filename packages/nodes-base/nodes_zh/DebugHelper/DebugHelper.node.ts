import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { ApplicationError, NodeApiError, NodeOperationError } from 'n8n-workflow';
import { setSeed, array as mfArray } from 'minifaker';
import {
	generateCreditCard,
	generateIPv4,
	generateIPv6,
	generateLocation,
	generateMAC,
	generateNanoid,
	generateRandomAddress,
	generateRandomEmail,
	generateRandomUser,
	generateURL,
	generateUUID,
	generateVersion,
} from './randomData';
import { generateGarbageMemory, runGarbageCollector } from './functions';

export class DebugHelper implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'DebugHelper',
		name: 'debugHelper',
		icon: 'file:DebugHelper.svg',
		group: ['output'],
		subtitle: '={{$parameter["category"]}}',
		description: '故意引发问题并生成用于调试的有用数据',
		version: 1,
		defaults: {
			name: 'DebugHelper',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [],
		properties: [
			{
				"displayName": "类别",
				"name": "category",
				"type": "options",
				"noDataExpression": true,
				"options": [
					{
						"name": "不执行任何操作",
						"value": "doNothing",
						"description": "不执行任何操作"
					},
					{
						"name": "抛出错误",
						"value": "throwError",
						"description": "抛出具有指定类型和消息的错误"
					},
					{
						"name": "内存不足",
						"value": "oom",
						"description": "生成大量内存以引发内存不足错误"
					},
					{
						"name": "生成随机数据",
						"value": "randomData",
						"description": "生成随机数据集"
					}
				],
				"default": "throwError"
			},
			{
				"displayName": "错误类型",
				"name": "throwErrorType",
				"type": "options",
				"noDataExpression": true,
				"options": [
					{
						"name": "NodeApiError",
						"value": "NodeApiError"
					},
					{
						"name": "NodeOperationError",
						"value": "NodeOperationError"
					},
					{
						"name": "Error",
						"value": "Error"
					}
				],
				"default": "NodeApiError",
				"displayOptions": {
					"show": {
						"category": ["throwError"]
					}
				}
			},
			{
				"displayName": "错误消息",
				"name": "throwErrorMessage",
				"type": "string",
				"default": "Node has thrown an error",
				"description": "作为错误的一部分发送的消息",
				"displayOptions": {
					"show": {
						"category": ["throwError"]
					}
				}
			},


			{
				"displayName": "生成的内存大小",
				"name": "memorySizeValue",
				"type": "number",
				"default": 10,
				"description": "生成的内存的大致数量。要慷慨点...",
				"displayOptions": {
					"show": {
						"category": ["oom"]
					}
				}
			},
			{
				"displayName": "数据类型",
				"name": "randomDataType",
				"type": "options",
				"noDataExpression": true,
				"options": [
					{
						"name": "地址",
						"value": "address"
					},
					{
						"name": "坐标",
						"value": "latLong"
					},
					{
						"name": "信用卡",
						"value": "creditCard"
					},
					{
						"name": "电子邮件",
						"value": "email"
					},
					{
						"name": "IPv4",
						"value": "ipv4"
					},
					{
						"name": "IPv6",
						"value": "ipv6"
					},
					{
						"name": "MAC",
						"value": "macAddress"
					},
					{
						"name": "NanoIds",
						"value": "nanoid"
					},
					{
						"name": "URL",
						"value": "url"
					},
					{
						"name": "用户数据",
						"value": "user"
					},
					{
						"name": "UUID",
						"value": "uuid"
					},
					{
						"name": "版本",
						"value": "semver"
					}
				],
				"default": "user",
				"displayOptions": {
					"show": {
						"category": ["randomData"]
					}
				}
			},
			{
				"displayName": "NanoId 字母表",
				"name": "nanoidAlphabet",
				"type": "string",
				"default": "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",
				"description": "用于生成 nanoIds 的字母表",
				"displayOptions": {
					"show": {
						"category": ["randomData"],
						"randomDataType": ["nanoid"]
					}
				}
			},
			{
				"displayName": "NanoId 长度",
				"name": "nanoidLength",
				"type": "string",
				"default": "16",
				"description": "每个 nanoIds 的长度",
				"displayOptions": {
					"show": {
						"category": ["randomData"],
						"randomDataType": ["nanoid"]
					}
				}
			},
			{
				"displayName": "种子",
				"name": "randomDataSeed",
				"type": "string",
				"default": "",
				"placeholder": "留空以使用随机种子",
				"description": "如果设置，用于生成数据的种子（相同的种子将生成相同的数据）",
				"displayOptions": {
					"show": {
						"category": ["randomData"]
					}
				}
			},
			{
				"displayName": "生成的项目数量",
				"name": "randomDataCount",
				"type": "number",
				"default": 10,
				"description": "要生成的随机数据项的数量，生成到数组中",
				"displayOptions": {
					"show": {
						"category": ["randomData"]
					}
				}
			},
			{
				"displayName": "输出为单个数组",
				"name": "randomDataSingleArray",
				"type": "boolean",
				"default": false,
				"description": "是否输出单个数组而不是多个项目",
				"displayOptions": {
					"show": {
						"category": ["randomData"]
					}
				}
			}

		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const category = this.getNodeParameter('category', 0) as string;

		for (let i = 0; i < items.length; i++) {
			try {
				switch (category) {
					case 'doNothing':
						// as it says on the tin...
						break;
					case 'throwError':
						const throwErrorType = this.getNodeParameter('throwErrorType', 0) as string;
						const throwErrorMessage = this.getNodeParameter('throwErrorMessage', 0) as string;
						switch (throwErrorType) {
							case 'NodeApiError':
								throw new NodeApiError(
									this.getNode(),
									{ message: throwErrorMessage },
									{ message: throwErrorMessage },
								);
							case 'NodeOperationError':
								throw new NodeOperationError(this.getNode(), throwErrorMessage, {
									message: throwErrorMessage,
								});
							case 'Error':
								// eslint-disable-next-line n8n-nodes-base/node-execute-block-wrong-error-thrown
								throw new ApplicationError(throwErrorMessage);
							default:
								break;
						}
					case 'oom':
						const memorySizeValue = this.getNodeParameter('memorySizeValue', 0) as number;
						runGarbageCollector();
						const memUsed = generateGarbageMemory(memorySizeValue);
						items[i].json = memUsed;
						returnData.push(items[i]);
						break;
					case 'randomData':
						const randomDataType = this.getNodeParameter('randomDataType', 0) as string;
						const randomDataCount = this.getNodeParameter('randomDataCount', 0) as number;
						const randomDataSeed = this.getNodeParameter('randomDataSeed', 0) as string;
						const randomDataSingleArray = this.getNodeParameter(
							'randomDataSingleArray',
							0,
						) as boolean;
						const newItem: INodeExecutionData = {
							json: {},
							pairedItem: { item: i },
						};
						if (randomDataSeed !== '') {
							setSeed(randomDataSeed);
						}

						let randomFn: () => any = generateRandomUser;
						switch (randomDataType) {
							case 'user':
								randomFn = generateRandomUser;
								break;
							case 'email':
								randomFn = generateRandomEmail;
								break;
							case 'address':
								randomFn = generateRandomAddress;
								break;
							case 'creditCard':
								randomFn = generateCreditCard;
								break;
							case 'uuid':
								randomFn = generateUUID;
								break;
							case 'macAddress':
								randomFn = generateMAC;
								break;
							case 'ipv4':
								randomFn = generateIPv4;
								break;
							case 'ipv6':
								randomFn = generateIPv6;
								break;
							case 'latLong':
								randomFn = generateLocation;
								break;
							case 'semver':
								randomFn = generateVersion;
								break;
							case 'url':
								randomFn = generateURL;
								break;
							case 'nanoid':
								const nanoidAlphabet = this.getNodeParameter('nanoidAlphabet', 0) as string;
								const nanoidLength = this.getNodeParameter('nanoidLength', 0) as string;
								randomFn = () => generateNanoid(nanoidAlphabet, nanoidLength);
								break;
						}
						const generatedItems = mfArray(randomDataCount, randomFn);
						if (randomDataSingleArray) {
							newItem.json = { generatedItems };
							returnData.push(newItem);
						} else {
							for (const generatedItem of generatedItems) {
								returnData.push({
									json: generatedItem,
									pairedItem: { item: i },
								});
							}
						}
						break;
					default:
						break;
				}
			} catch (error) {
				if (this.continueOnFail()) {
					const executionErrorData = this.helpers.constructExecutionMetaData(
						this.helpers.returnJsonArray({ error: error.message }),
						{ itemData: { item: i } },
					);
					returnData.push(...executionErrorData);
					continue;
				}
				throw error;
			}
		}
		return [returnData];
	}
}
