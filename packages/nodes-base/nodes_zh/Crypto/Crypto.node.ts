import type { BinaryToTextEncoding } from 'crypto';
import { createHash, createHmac, createSign, getHashes, randomBytes } from 'crypto';
import { pipeline } from 'stream/promises';
import { v4 as uuid } from 'uuid';
import set from 'lodash/set';
import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	JsonObject,
} from 'n8n-workflow';
import { deepCopy, BINARY_ENCODING } from 'n8n-workflow';

const unsupportedAlgorithms = [
	'RSA-MD4',
	'RSA-MDC2',
	'md4',
	'md4WithRSAEncryption',
	'mdc2',
	'mdc2WithRSA',
];

const supportedAlgorithms = getHashes()
	.filter((algorithm) => !unsupportedAlgorithms.includes(algorithm))
	.map((algorithm) => ({ name: algorithm, value: algorithm }));

export class Crypto implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Crypto',
		name: 'crypto',
		icon: 'fa:key',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["action"]}}',
		description: '提供加密工具',
		defaults: {
			name: 'Crypto',
			color: '#408000',
		},
		inputs: ['main'],
		outputs: ['main'],
		properties: [
			{
				"displayName": "操作",
				"name": "action",
				"type": "options",
				"options": [
					{
						"name": "生成",
						"description": "生成随机字符串",
						"value": "generate",
						"action": "生成随机字符串"
					},
					{
						"name": "哈希",
						"description": "在指定格式中哈希文本或文件",
						"value": "hash",
						"action": "在指定格式中哈希文本或文件"
					},
					{
						"name": "Hmac",
						"description": "在指定格式中对文本或文件进行 Hmac",
						"value": "hmac",
						"action": "在指定格式中对文本或文件进行 Hmac"
					},
					{
						"name": "签名",
						"description": "使用私钥签名字符串",
						"value": "sign",
						"action": "使用私钥签名字符串"
					}
				],
				"default": "hash"
			},
			{
				"displayName": "类型",
				"name": "type",
				"displayOptions": {
					"show": {
						"action": ["hash"]
					}
				},
				"type": "options",
				"options": [
					{
						"name": "MD5",
						"value": "MD5"
					},
					{
						"name": "SHA256",
						"value": "SHA256"
					},
					{
						"name": "SHA3-256",
						"value": "SHA3-256"
					},
					{
						"name": "SHA3-384",
						"value": "SHA3-384"
					},
					{
						"name": "SHA3-512",
						"value": "SHA3-512"
					},
					{
						"name": "SHA384",
						"value": "SHA384"
					},
					{
						"name": "SHA512",
						"value": "SHA512"
					}
				],
				"default": "MD5",
				"description": "要使用的哈希类型",
				"required": true
			},
			{
				"displayName": "二进制文件",
				"name": "binaryData",
				"type": "boolean",
				"default": false,
				"required": true,
				"displayOptions": {
					"show": {
						"action": ["hash", "hmac"]
					}
				},
				"description": "是否从二进制字段中取得要进行哈希处理的数据"
			},

			{
				"displayName": "二进制属性名称",
				"name": "binaryPropertyName",
				"displayOptions": {
					"show": {
						"action": ["hash", "hmac"],
						"binaryData": [true]
					}
				},
				"type": "string",
				"default": "data",
				"description": "包含输入数据的二进制属性的名称",
				"required": true
			},


			{
				"displayName": "值",
				"name": "value",
				"displayOptions": {
					"show": {
						"action": ["hash"],
						"binaryData": [false]
					}
				},
				"type": "string",
				"default": "",
				"description": "要进行哈希的值",
				"required": true
			},
			{
				"displayName": "属性名称",
				"name": "dataPropertyName",
				"type": "string",
				"default": "data",
				"required": true,
				"displayOptions": {
					"show": {
						"action": ["hash"]
					}
				},
				"description": "要写入哈希值的属性的名称"
			},
			{
				"displayName": "编码",
				"name": "encoding",
				"displayOptions": {
					"show": {
						"action": ["hash"]
					}
				},
				"type": "options",
				"options": [
					{
						"name": "BASE64",
						"value": "base64"
					},
					{
						"name": "HEX",
						"value": "hex"
					}
				],
				"default": "hex",
				"required": true
			},
			{
				"displayName": "类型",
				"name": "type",
				"displayOptions": {
					"show": {
						"action": ["hmac"]
					}
				},
				"type": "options",
				"options": [
					{
						"name": "MD5",
						"value": "MD5"
					},
					{
						"name": "SHA256",
						"value": "SHA256"
					},
					{
						"name": "SHA3-256",
						"value": "SHA3-256"
					},
					{
						"name": "SHA3-384",
						"value": "SHA3-384"
					},
					{
						"name": "SHA3-512",
						"value": "SHA3-512"
					},
					{
						"name": "SHA384",
						"value": "SHA384"
					},
					{
						"name": "SHA512",
						"value": "SHA512"
					}
				],
				"default": "MD5",
				"description": "要使用的哈希类型",
				"required": true
			},
			{
				"displayName": "值",
				"name": "value",
				"displayOptions": {
					"show": {
						"action": ["hmac"],
						"binaryData": [false]
					}
				},
				"type": "string",
				"default": "",
				"description": "要创建hmac的值",
				"required": true
			},



			{
				"displayName": "属性名称",
				"name": "dataPropertyName",
				"type": "string",
				"default": "data",
				"required": true,
				"displayOptions": {
					"show": {
						"action": ["hmac"]
					}
				},
				"description": "要写入hmac的属性的名称"
			},
			{
				"displayName": "密钥",
				"name": "secret",
				"displayOptions": {
					"show": {
						"action": ["hmac"]
					}
				},
				"type": "string",
				"typeOptions": {
					"password": true
				},
				"default": "",
				"required": true
			},
			{
				"displayName": "编码",
				"name": "encoding",
				"displayOptions": {
					"show": {
						"action": ["hmac"]
					}
				},
				"type": "options",
				"options": [
					{
						"name": "BASE64",
						"value": "base64"
					},
					{
						"name": "HEX",
						"value": "hex"
					}
				],
				"default": "hex",
				"required": true
			},
			{
				"displayName": "值",
				"name": "value",
				"displayOptions": {
					"show": {
						"action": ["sign"]
					}
				},
				"type": "string",
				"default": "",
				"description": "要签名的值",
				"required": true
			},
			{
				"displayName": "属性名称",
				"name": "dataPropertyName",
				"type": "string",
				"default": "data",
				"required": true,
				"displayOptions": {
					"show": {
						"action": ["sign"]
					}
				},
				"description": "要写入签名值的属性的名称"
			},
			{
				"displayName": "算法名称或ID",
				"name": "algorithm",
				"displayOptions": {
					"show": {
						"action": ["sign"]
					}
				},
				"type": "options",
				"description": "从列表中选择，或使用<a href=\"https://docs.n8n.io/code-examples/expressions/\">表达式</a>指定ID",
				"options": supportedAlgorithms,
				"default": "",
				"required": true
			},



			{
				"displayName": "编码",
				"name": "encoding",
				"displayOptions": {
					"show": {
						"action": ["sign"]
					}
				},
				"type": "options",
				"options": [
					{
						"name": "BASE64",
						"value": "base64"
					},
					{
						"name": "HEX",
						"value": "hex"
					}
				],
				"default": "hex",
				"required": true
			},
			{
				"displayName": "私钥",
				"name": "privateKey",
				"displayOptions": {
					"show": {
						"action": ["sign"]
					}
				},
				"type": "string",
				"description": "签名字符串时要使用的私钥",
				"default": "",
				"required": true
			},
			{
				"displayName": "属性名称",
				"name": "dataPropertyName",
				"type": "string",
				"default": "data",
				"required": true,
				"displayOptions": {
					"show": {
						"action": ["generate"]
					}
				},
				"description": "要写入随机字符串的属性的名称"
			},
			{
				"displayName": "类型",
				"name": "encodingType",
				"displayOptions": {
					"show": {
						"action": ["generate"]
					}
				},
				"type": "options",
				"options": [
					{
						"name": "ASCII",
						"value": "ascii"
					},
					{
						"name": "BASE64",
						"value": "base64"
					},
					{
						"name": "HEX",
						"value": "hex"
					},
					{
						"name": "UUID",
						"value": "uuid"
					}
				],
				"default": "uuid",
				"description": "生成字符串时要使用的编码方式",
				"required": true
			},
			{
				"displayName": "长度",
				"name": "stringLength",
				"type": "number",
				"default": 32,
				"description": "生成字符串的长度",
				"displayOptions": {
					"show": {
						"action": ["generate"],
						"encodingType": ["ascii", "base64", "hex"]
					}
				}
			}

		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();

		const returnData: INodeExecutionData[] = [];
		const length = items.length;
		const action = this.getNodeParameter('action', 0) as string;

		let item: INodeExecutionData;
		for (let i = 0; i < length; i++) {
			try {
				item = items[i];
				const dataPropertyName = this.getNodeParameter('dataPropertyName', i);
				const value = this.getNodeParameter('value', i, '') as string;
				let newValue;
				let binaryProcessed = false;

				if (action === 'generate') {
					const encodingType = this.getNodeParameter('encodingType', i);
					if (encodingType === 'uuid') {
						newValue = uuid();
					} else {
						const stringLength = this.getNodeParameter('stringLength', i) as number;
						if (encodingType === 'base64') {
							newValue = randomBytes(stringLength)
								.toString(encodingType as BufferEncoding)
								.replace(/\W/g, '')
								.slice(0, stringLength);
						} else {
							newValue = randomBytes(stringLength)
								.toString(encodingType as BufferEncoding)
								.slice(0, stringLength);
						}
					}
				}

				if (action === 'hash' || action === 'hmac') {
					const type = this.getNodeParameter('type', i) as string;
					const encoding = this.getNodeParameter('encoding', i) as BinaryToTextEncoding;
					const hashOrHmac =
						action === 'hash'
							? createHash(type)
							: createHmac(type, this.getNodeParameter('secret', i) as string);
					if (this.getNodeParameter('binaryData', i)) {
						const binaryPropertyName = this.getNodeParameter('binaryPropertyName', i);
						const binaryData = this.helpers.assertBinaryData(i, binaryPropertyName);
						if (binaryData.id) {
							const binaryStream = await this.helpers.getBinaryStream(binaryData.id);
							hashOrHmac.setEncoding(encoding);
							await pipeline(binaryStream, hashOrHmac);
							newValue = hashOrHmac.read();
						} else {
							newValue = hashOrHmac
								.update(Buffer.from(binaryData.data, BINARY_ENCODING))
								.digest(encoding);
						}
						binaryProcessed = true;
					} else {
						newValue = hashOrHmac.update(value).digest(encoding);
					}
				}

				if (action === 'sign') {
					const algorithm = this.getNodeParameter('algorithm', i) as string;
					const encoding = this.getNodeParameter('encoding', i) as BinaryToTextEncoding;
					const privateKey = this.getNodeParameter('privateKey', i) as string;
					const sign = createSign(algorithm);
					sign.write(value);
					sign.end();
					newValue = sign.sign(privateKey, encoding);
				}

				let newItem: INodeExecutionData;
				if (dataPropertyName.includes('.')) {
					// Uses dot notation so copy all data
					newItem = {
						json: deepCopy(item.json),
						pairedItem: {
							item: i,
						},
					};
				} else {
					// Does not use dot notation so shallow copy is enough
					newItem = {
						json: { ...item.json },
						pairedItem: {
							item: i,
						},
					};
				}

				if (item.binary !== undefined && !binaryProcessed) {
					newItem.binary = item.binary;
				}

				set(newItem, ['json', dataPropertyName], newValue);

				returnData.push(newItem);
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							error: (error as JsonObject).message,
						},
						pairedItem: {
							item: i,
						},
					});
					continue;
				}
				throw error;
			}
		}
		return [returnData];
	}
}
