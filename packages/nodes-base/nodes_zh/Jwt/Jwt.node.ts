import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import jwt from 'jsonwebtoken';

import { formatPrivateKey } from '../../utils/utilities';
import { parseJsonParameter } from '../Set/v2/helpers/utils';

const prettifyOperation = (operation: string) => {
	if (operation === 'sign') {
		return 'Sign a JWT';
	}

	if (operation === 'decode') {
		return 'Decode a JWT';
	}

	if (operation === 'verify') {
		return 'Verify a JWT';
	}

	return operation;
};

const getToken = (ctx: IExecuteFunctions, itemIndex = 0) => {
	const token = ctx.getNodeParameter('token', itemIndex) as string;

	if (!token) {
		throw new NodeOperationError(ctx.getNode(), '未提供 JWT 标记', {
			itemIndex,
			description: "请确保在 令牌 参数中添加有效的 JWT 令牌",
		});
	}

	return token;
};

export class Jwt implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'JWT',
		name: 'jwt',
		icon: 'file:jwt.svg',
		group: ['transform'],
		version: 1,
		description: 'JWT',
		subtitle: `={{(${prettifyOperation})($parameter.operation)}}`,
		defaults: {
			name: 'JWT',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				// eslint-disable-next-line n8n-nodes-base/node-class-description-credentials-name-unsuffixed
				name: 'jwtAuth',
				required: true,
			},
		],
		properties: [
			{
				"displayName": "操作",
				"name": "operation",
				"type": "options",
				"noDataExpression": true,
				"options": [
					{
						"name": "解码",
						"value": "decode",
						"action": "解码 JWT"
					},
					{
						"name": "签名",
						"value": "sign",
						"action": "签名 JWT"
					},
					{
						"name": "验证",
						"value": "verify",
						"action": "验证 JWT"
					}
				],
				"default": "sign"
			},
			{
				"displayName": "使用 JSON 构建负载",
				"name": "useJson",
				"type": "boolean",
				"default": false,
				"description": "是否使用 JSON 构建声明",
				"displayOptions": {
					"show": {
						"operation": ["sign"]
					}
				}
			},


			{
				"displayName": "负载声明",
				"name": "claims",
				"type": "collection",
				"placeholder": "添加声明",
				"default": {},
				"options": [
					{
						"displayName": "接收方",
						"name": "audience",
						"type": "string",
						"placeholder": "例如 https://example.com",
						"default": "",
						"description": "标识 JWT 预期的接收方"
					},
					{
						"displayName": "过期时间",
						"name": "expiresIn",
						"type": "number",
						"placeholder": "例如 3600",
						"default": 3600,
						"description": "令牌的生存期（秒）",
						"typeOptions": {
							"minValue": 0
						}
					},
					{
						"displayName": "签发者",
						"name": "issuer",
						"type": "string",
						"placeholder": "例如 https://example.com",
						"default": "",
						"description": "标识签发 JWT 的主体"
					},
					{
						"displayName": "JWT ID",
						"name": "jwtid",
						"type": "string",
						"placeholder": "例如 123456",
						"default": "",
						"description": "JWT 的唯一标识符"
					},
					{
						"displayName": "生效时间",
						"name": "notBefore",
						"type": "number",
						"default": 0,
						"description": "在此时间之前，JWT 不应接受处理",
						"typeOptions": {
							"minValue": 0
						}
					},
					{
						"displayName": "主体",
						"name": "subject",
						"type": "string",
						"default": "",
						"description": "标识 JWT 的主体"
					}
				],
				"displayOptions": {
					"show": {
						"operation": ["sign"],
						"useJson": [false]
					}
				}
			},
			{
				"displayName": "负载声明 (JSON)",
				"name": "claimsJson",
				"type": "json",
				"description": "以 JSON 格式添加到令牌的声明",
				"default": "{\n  \"my_field_1\": \"value 1\",\n  \"my_field_2\": \"value 2\"\n}\n",
				"validateType": "object",
				"ignoreValidationDuringExecution": true,
				"typeOptions": {
					"rows": 5
				},
				"displayOptions": {
					"show": {
						"operation": ["sign"],
						"useJson": [true]
					}
				}
			},
			{
				"displayName": "令牌",
				"name": "token",
				"type": "string",
				"typeOptions": {
					"password": true
				},
				"required": true,
				"validateType": "jwt",
				"default": "",
				"description": "要验证或解码的令牌",
				"displayOptions": {
					"show": {
						"operation": ["verify", "decode"]
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
						"displayName": "返回额外信息",
						"name": "complete",
						"type": "boolean",
						"default": false,
						"description": "是否返回包含有关标头和签名的完整解码令牌的信息，或仅返回有效负载",
						"displayOptions": {
							"show": {
								"/operation": ["verify", "decode"]
							}
						}
					},
					{
						"displayName": "忽略过期时间",
						"name": "ignoreExpiration",
						"type": "boolean",
						"default": false,
						"description": "是否忽略令牌的过期时间",
						"displayOptions": {
							"show": {
								"/operation": ["verify"]
							}
						}
					},
					{
						"displayName": "忽略生效时间",
						"name": "ignoreNotBefore",
						"type": "boolean",
						"default": false,
						"description": "是否忽略令牌的生效时间声明",
						"displayOptions": {
							"show": {
								"/operation": ["verify"]
							}
						}
					},
					{
						"displayName": "时钟容忍度",
						"name": "clockTolerance",
						"type": "number",
						"default": 0,
						"description": "检查 nbf 和 exp 声明时要容忍的秒数，以处理不同服务器之间的小时钟差异",
						"typeOptions": {
							"minValue": 0
						},
						"displayOptions": {
							"show": {
								"/operation": ["verify"]
							}
						}
					},
					{
						"displayName": "覆盖算法",
						"name": "algorithm",
						"type": "options",
						"options": [
							{
								"name": "ES256",
								"value": "ES256"
							},
							{
								"name": "ES384",
								"value": "ES384"
							},
							{
								"name": "ES512",
								"value": "ES512"
							},
							{
								"name": "HS256",
								"value": "HS256"
							},
							{
								"name": "HS384",
								"value": "HS384"
							},
							{
								"name": "HS512",
								"value": "HS512"
							},
							{
								"name": "PS256",
								"value": "PS256"
							},
							{
								"name": "PS384",
								"value": "PS384"
							},
							{
								"name": "PS512",
								"value": "PS512"
							},
							{
								"name": "RS256",
								"value": "RS256"
							},
							{
								"name": "RS384",
								"value": "RS384"
							},
							{
								"name": "RS512",
								"value": "RS512"
							}
						],
						"default": "HS256",
						"description": "用于签署或验证令牌的算法，覆盖凭据中的算法",
						"displayOptions": {
							"show": {
								"/operation": ["sign", "verify"]
							}
						}
					}
				]
			}
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		const operation = this.getNodeParameter('operation', 0);

		const credentials = (await this.getCredentials('jwtAuth')) as {
			keyType: 'passphrase' | 'pemKey';
			publicKey: string;
			privateKey: string;
			secret: string;
			algorithm: jwt.Algorithm;
		};

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			const options = this.getNodeParameter('options', itemIndex, {}) as {
				algorithm?: jwt.Algorithm;
				complete?: boolean;
				ignoreExpiration?: boolean;
				ignoreNotBefore?: boolean;
				clockTolerance?: number;
			};

			try {
				if (operation === 'sign') {
					const useJson = this.getNodeParameter('useJson', itemIndex) as boolean;

					let payload: IDataObject = {};

					if (useJson) {
						payload = parseJsonParameter(
							this.getNodeParameter('claimsJson', itemIndex) as IDataObject,
							this.getNode(),
							itemIndex,
						);
					} else {
						payload = this.getNodeParameter('claims', itemIndex) as IDataObject;
					}

					let secretOrPrivateKey;

					if (credentials.keyType === 'passphrase') {
						secretOrPrivateKey = credentials.secret;
					} else {
						secretOrPrivateKey = formatPrivateKey(credentials.privateKey);
					}

					const token = jwt.sign(payload, secretOrPrivateKey, {
						algorithm: options.algorithm ?? credentials.algorithm,
					});

					returnData.push({
						json: { token },
						pairedItem: itemIndex,
					});
				}

				if (operation === 'verify') {
					const token = getToken(this, itemIndex);

					let secretOrPublicKey;

					if (credentials.keyType === 'passphrase') {
						secretOrPublicKey = credentials.secret;
					} else {
						secretOrPublicKey = formatPrivateKey(credentials.publicKey, true);
					}

					const { ignoreExpiration, ignoreNotBefore, clockTolerance, complete } = options;

					const data = jwt.verify(token, secretOrPublicKey, {
						algorithms: [options.algorithm ?? credentials.algorithm],
						ignoreExpiration,
						ignoreNotBefore,
						clockTolerance,
						complete,
					});

					const json = options.complete && data ? (data as IDataObject) : { payload: data };

					returnData.push({
						json,
						pairedItem: itemIndex,
					});
				}

				if (operation === 'decode') {
					const token = getToken(this, itemIndex);

					const data = jwt.decode(token, { complete: options.complete });

					const json = options.complete && data ? (data as IDataObject) : { payload: data };

					returnData.push({
						json,
						pairedItem: itemIndex,
					});
				}
			} catch (error) {
				if (error.message === 'invalid signature') {
					error = new NodeOperationError(this.getNode(), "The JWT token can't be verified", {
						itemIndex,
						description:
							'Be sure that the provided JWT token is correctly encoded and matches the selected credentials',
					});
				}
				if (this.continueOnFail()) {
					returnData.push({
						json: this.getInputData(itemIndex)[0].json,
						error,
						pairedItem: itemIndex,
					});
					continue;
				}
				if (error.context) {
					error.context.itemIndex = itemIndex;
					throw error;
				}
				throw new NodeOperationError(this.getNode(), error, {
					itemIndex,
				});
			}
		}

		return [returnData];
	}
}
