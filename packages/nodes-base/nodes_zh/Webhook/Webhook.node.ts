/* eslint-disable n8n-nodes-base/node-execute-block-wrong-error-thrown */
import { pipeline } from 'stream/promises';
import { createWriteStream } from 'fs';
import { stat } from 'fs/promises';
import type {
	IWebhookFunctions,
	ICredentialDataDecryptedObject,
	IDataObject,
	INodeExecutionData,
	INodeTypeDescription,
	IWebhookResponseData,
	MultiPartFormData,
	INodeProperties,
} from 'n8n-workflow';
import { BINARY_ENCODING, NodeOperationError, Node } from 'n8n-workflow';

import { v4 as uuid } from 'uuid';
import basicAuth from 'basic-auth';
import isbot from 'isbot';
import { file as tmpFile } from 'tmp-promise';
import jwt from 'jsonwebtoken';

import {
	authenticationProperty,
	credentialsProperty,
	defaultWebhookDescription,
	httpMethodsProperty,
	optionsProperty,
	responseBinaryPropertyNameProperty,
	responseCodeOption,
	responseCodeProperty,
	responseDataProperty,
	responseModeProperty,
} from './description';
import { WebhookAuthorizationError } from './error';
import {
	checkResponseModeConfiguration,
	configuredOutputs,
	isIpWhitelisted,
	setupOutputConnection,
} from './utils';
import { formatPrivateKey } from '../../utils/utilities';

export class Webhook extends Node {
	authPropertyName = 'authentication';

	description: INodeTypeDescription = {
		displayName: 'Webhook',
		icon: 'file:webhook.svg',
		name: 'webhook',
		group: ['trigger'],
		version: [1, 1.1, 2],
		description: '调用网络钩子时启动工作流',
		eventTriggerDescription: '等待您调用测试 URL',
		activationMessage: '现在，您可以调用生产网络钩子 URL		.',
		defaults: {
			name: 'Webhook',
		},
		supportsCORS: true,
		triggerPanel: {
			"header": "",
			"executionsHelp": {
				"inactive": "Webhooks有两种模式：测试模式和生产模式。<br /><br /><b>在构建工作流时使用测试模式</b>。点击\"监听\"按钮，然后向测试URL发送请求。执行将显示在编辑器中。<br /><br /><b>在自动运行工作流时使用生产模式</b>。 <a data-key=\"activate\">激活</a>工作流，然后向生产URL发送请求。这些执行将显示在执行列表中，但不会显示在编辑器中。",
				"active": "Webhooks有两种模式：测试模式和生产模式。<br /><br /><b>在构建工作流时使用测试模式</b>。点击\"监听\"按钮，然后向测试URL发送请求。执行将显示在编辑器中。<br /><br /><b>在自动运行工作流时使用生产模式</b>。由于工作流已激活，您可以向生产URL发送请求。这些执行将显示在<a data-key=\"executions\">执行列表</a>中，但不会显示在编辑器中。"
			},
			"activationHint": "完成构建工作流后，通过使用生产Webhook URL，无需点击此按钮即可运行它。"
		},
		// eslint-disable-next-line n8n-nodes-base/node-class-description-inputs-wrong-regular-node
		inputs: [],
		outputs: `={{(${configuredOutputs})($parameter)}}`,
		credentials: credentialsProperty(this.authPropertyName),
		webhooks: [defaultWebhookDescription],
		properties: [
			httpMethodsProperty,
			{
				"displayName": "路径",
				"name": "path",
				"type": "string",
				"default": "",
				"placeholder": "webhook",
				"required": true,
				"description": "要监听的路径，可以通过使用':'指定动态值，例如 'your-path/:dynamic-value'。如果设置了动态值，将会在路径前面添加 'webhookId'。",
			},

			authenticationProperty(this.authPropertyName),
			responseModeProperty,
			{
				"displayName": "插入一个'响应Webhook'节点来控制何时以及如何响应。 <a href=\"https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.respondtowebhook/\" target=\"_blank\">更多细节</a>",
				"name": "webhookNotice",
				"type": "notice",
				"displayOptions": {
					"show": {
						"responseMode": ["responseNode"]
					}
				},
				"default": ""
			},

			{
				...responseCodeProperty,
				displayOptions: {
					show: {
						'@version': [1, 1.1],
					},
					hide: {
						responseMode: ['responseNode'],
					},
				},
			},
			responseDataProperty,
			responseBinaryPropertyNameProperty,

			{
				...optionsProperty,
				options: [...(optionsProperty.options as INodeProperties[]), responseCodeOption].sort(
					(a, b) => {
						const nameA = a.displayName.toUpperCase();
						const nameB = b.displayName.toUpperCase();
						if (nameA < nameB) return -1;
						if (nameA > nameB) return 1;
						return 0;
					},
				),
			},
		],
	};

	async webhook(context: IWebhookFunctions): Promise<IWebhookResponseData> {
		const { typeVersion: nodeVersion, type: nodeType } = context.getNode();

		if (nodeVersion >= 2 && nodeType === 'n8n-nodes-base.webhook') {
			checkResponseModeConfiguration(context);
		}

		const options = context.getNodeParameter('options', {}) as {
			binaryData: boolean;
			ignoreBots: boolean;
			rawBody: boolean;
			responseData?: string;
			ipWhitelist?: string;
		};
		const req = context.getRequestObject();
		const resp = context.getResponseObject();

		if (!isIpWhitelisted(options.ipWhitelist, req.ips, req.ip)) {
			resp.writeHead(403);
			resp.end('IP is not whitelisted to access the webhook!');
			return { noWebhookResponse: true };
		}

		let validationData: IDataObject | undefined;
		try {
			if (options.ignoreBots && isbot(req.headers['user-agent']))
				throw new WebhookAuthorizationError(403);
			validationData = await this.validateAuth(context);
		} catch (error) {
			if (error instanceof WebhookAuthorizationError) {
				resp.writeHead(error.responseCode, { 'WWW-Authenticate': 'Basic realm="Webhook"' });
				resp.end(error.message);
				return { noWebhookResponse: true };
			}
			throw error;
		}

		const prepareOutput = setupOutputConnection(context, {
			jwtPayload: validationData,
		});

		if (options.binaryData) {
			return await this.handleBinaryData(context, prepareOutput);
		}

		if (req.contentType === 'multipart/form-data') {
			return await this.handleFormData(context, prepareOutput);
		}

		if (nodeVersion > 1 && !req.body && !options.rawBody) {
			try {
				return await this.handleBinaryData(context, prepareOutput);
			} catch (error) { }
		}

		if (options.rawBody && !req.rawBody) {
			await req.readRawBody();
		}

		const response: INodeExecutionData = {
			json: {
				headers: req.headers,
				params: req.params,
				query: req.query,
				body: req.body,
			},
			binary: options.rawBody
				? {
					data: {
						data: (req.rawBody ?? '').toString(BINARY_ENCODING),
						mimeType: req.contentType ?? 'application/json',
					},
				}
				: undefined,
		};

		return {
			webhookResponse: options.responseData,
			workflowData: prepareOutput(response),
		};
	}

	private async validateAuth(context: IWebhookFunctions) {
		const authentication = context.getNodeParameter(this.authPropertyName) as string;
		if (authentication === 'none') return;

		const req = context.getRequestObject();
		const headers = context.getHeaderData();

		if (authentication === 'basicAuth') {
			// Basic authorization is needed to call webhook
			let expectedAuth: ICredentialDataDecryptedObject | undefined;
			try {
				expectedAuth = await context.getCredentials('httpBasicAuth');
			} catch { }

			if (expectedAuth === undefined || !expectedAuth.user || !expectedAuth.password) {
				// Data is not defined on node so can not authenticate
				throw new WebhookAuthorizationError(500, 'No authentication data defined on node!');
			}

			const providedAuth = basicAuth(req);
			// Authorization data is missing
			if (!providedAuth) throw new WebhookAuthorizationError(401);

			if (providedAuth.name !== expectedAuth.user || providedAuth.pass !== expectedAuth.password) {
				// Provided authentication data is wrong
				throw new WebhookAuthorizationError(403);
			}
		} else if (authentication === 'headerAuth') {
			// Special header with value is needed to call webhook
			let expectedAuth: ICredentialDataDecryptedObject | undefined;
			try {
				expectedAuth = await context.getCredentials('httpHeaderAuth');
			} catch { }

			if (expectedAuth === undefined || !expectedAuth.name || !expectedAuth.value) {
				// Data is not defined on node so can not authenticate
				throw new WebhookAuthorizationError(500, 'No authentication data defined on node!');
			}
			const headerName = (expectedAuth.name as string).toLowerCase();
			const expectedValue = expectedAuth.value as string;

			if (
				!headers.hasOwnProperty(headerName) ||
				(headers as IDataObject)[headerName] !== expectedValue
			) {
				// Provided authentication data is wrong
				throw new WebhookAuthorizationError(403);
			}
		} else if (authentication === 'jwtAuth') {
			let expectedAuth;

			try {
				expectedAuth = (await context.getCredentials('jwtAuth')) as {
					keyType: 'passphrase' | 'pemKey';
					publicKey: string;
					secret: string;
					algorithm: jwt.Algorithm;
				};
			} catch { }

			if (expectedAuth === undefined) {
				// Data is not defined on node so can not authenticate
				throw new WebhookAuthorizationError(500, 'No authentication data defined on node!');
			}

			const authHeader = req.headers.authorization;
			const token = authHeader && authHeader.split(' ')[1];

			if (!token) {
				throw new WebhookAuthorizationError(401, 'No token provided');
			}

			let secretOrPublicKey;

			if (expectedAuth.keyType === 'passphrase') {
				secretOrPublicKey = expectedAuth.secret;
			} else {
				secretOrPublicKey = formatPrivateKey(expectedAuth.publicKey, true);
			}

			try {
				return jwt.verify(token, secretOrPublicKey, {
					algorithms: [expectedAuth.algorithm],
				}) as IDataObject;
			} catch (error) {
				throw new WebhookAuthorizationError(403, error.message);
			}
		}
	}

	private async handleFormData(
		context: IWebhookFunctions,
		prepareOutput: (data: INodeExecutionData) => INodeExecutionData[][],
	) {
		const req = context.getRequestObject() as MultiPartFormData.Request;
		const options = context.getNodeParameter('options', {}) as IDataObject;
		const { data, files } = req.body;

		const returnItem: INodeExecutionData = {
			json: {
				headers: req.headers,
				params: req.params,
				query: req.query,
				body: data,
			},
		};

		if (files && Object.keys(files).length) {
			returnItem.binary = {};
		}

		let count = 0;

		for (const key of Object.keys(files)) {
			const processFiles: MultiPartFormData.File[] = [];
			let multiFile = false;
			if (Array.isArray(files[key])) {
				processFiles.push(...(files[key] as MultiPartFormData.File[]));
				multiFile = true;
			} else {
				processFiles.push(files[key] as MultiPartFormData.File);
			}

			let fileCount = 0;
			for (const file of processFiles) {
				let binaryPropertyName = key;
				if (binaryPropertyName.endsWith('[]')) {
					binaryPropertyName = binaryPropertyName.slice(0, -2);
				}
				if (multiFile) {
					binaryPropertyName += fileCount++;
				}
				if (options.binaryPropertyName) {
					binaryPropertyName = `${options.binaryPropertyName}${count}`;
				}

				returnItem.binary![binaryPropertyName] = await context.nodeHelpers.copyBinaryFile(
					file.filepath,
					file.originalFilename ?? file.newFilename,
					file.mimetype,
				);

				count += 1;
			}
		}

		return { workflowData: prepareOutput(returnItem) };
	}

	private async handleBinaryData(
		context: IWebhookFunctions,
		prepareOutput: (data: INodeExecutionData) => INodeExecutionData[][],
	): Promise<IWebhookResponseData> {
		const req = context.getRequestObject();
		const options = context.getNodeParameter('options', {}) as IDataObject;

		// TODO: create empty binaryData placeholder, stream into that path, and then finalize the binaryData
		const binaryFile = await tmpFile({ prefix: 'n8n-webhook-' });

		try {
			await pipeline(req, createWriteStream(binaryFile.path));

			const returnItem: INodeExecutionData = {
				json: {
					headers: req.headers,
					params: req.params,
					query: req.query,
					body: {},
				},
			};

			const stats = await stat(binaryFile.path);
			if (stats.size) {
				const binaryPropertyName = (options.binaryPropertyName ?? 'data') as string;
				const fileName = req.contentDisposition?.filename ?? uuid();
				const binaryData = await context.nodeHelpers.copyBinaryFile(
					binaryFile.path,
					fileName,
					req.contentType ?? 'application/octet-stream',
				);
				returnItem.binary = { [binaryPropertyName]: binaryData };
			}

			return { workflowData: prepareOutput(returnItem) };
		} catch (error) {
			throw new NodeOperationError(context.getNode(), error as Error);
		} finally {
			await binaryFile.cleanup();
		}
	}
}
