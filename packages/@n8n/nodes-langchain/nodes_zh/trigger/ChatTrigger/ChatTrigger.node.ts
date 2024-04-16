import {
	type IDataObject,
	type IWebhookFunctions,
	type IWebhookResponseData,
	type INodeType,
	type INodeTypeDescription,
	NodeConnectionType,
} from 'n8n-workflow';
import { pick } from 'lodash';
import type { BaseChatMemory } from '@langchain/community/memory/chat_memory';
import { createPage } from './templates';
import { validateAuth } from './GenericFunctions';
import type { LoadPreviousSessionChatOption } from './types';

const CHAT_TRIGGER_PATH_IDENTIFIER = 'chat';

export class ChatTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Chat Trigger',
		name: 'chatTrigger',
		icon: 'fa:comments',
		group: ['trigger'],
		version: 1,
		description: '当 n8n 生成的 Web 聊天被提交时运行工作流',
		defaults: {
			name: 'Chat Trigger',
		},
		codex: {
			categories: ['Core Nodes'],
			resources: {
				primaryDocumentation: [
					{
						url: 'https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-langchain.chattrigger/',
					},
				],
			},
			subcategories: {
				'Core Nodes': ['Other Trigger Nodes'],
			},
		},
		supportsCORS: true,
		maxNodes: 1,
		inputs: `={{ (() => {
			if (!['hostedChat', 'webhook'].includes($parameter.mode)) {
				return [];
			}
			if ($parameter.options?.loadPreviousSession !== 'memory') {
				return [];
			}

			return [
				{
					displayName: '内存',
					maxConnections: 1,
					type: '${NodeConnectionType.AiMemory}',
					required: true,
				}
			];
		 })() }}`,
		outputs: ['main'],
		credentials: [
			{
				// eslint-disable-next-line n8n-nodes-base/node-class-description-credentials-name-unsuffixed
				name: 'httpBasicAuth',
				required: true,
				displayOptions: {
					show: {
						authentication: ['basicAuth'],
					},
				},
			},
		],
		webhooks: [
			{
				name: 'setup',
				httpMethod: 'GET',
				responseMode: 'onReceived',
				path: CHAT_TRIGGER_PATH_IDENTIFIER,
				ndvHideUrl: true,
			},
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: '={{$parameter.options?.["responseMode"] || "lastNode" }}',
				path: CHAT_TRIGGER_PATH_IDENTIFIER,
				ndvHideMethod: true,
				ndvHideUrl: '={{ !$parameter.public }}',
			},
		],
		eventTriggerDescription: '等待您提交聊天',
		activationMessage: '现在您可以调用生产聊天的URL.',
		triggerPanel: false,
		properties: [
			/**
			 * @note If we change this property, also update it in ChatEmbedModal.vue
			 */
			{
				displayName: '使聊天公开可用',
				name: 'public',
				type: 'boolean',
				default: false,
				description: '聊天是否应该公开可用，或者仅通过手动聊天界面访问',
			},
			{
				displayName: '模式',
				name: 'mode',
				type: 'options',
				options: [
					{
						name: '托管聊天',
						value: 'hostedChat',
						description: '在由n8n提供的页面上进行聊天',
					},
					{
						name: '嵌入聊天',
						value: 'webhook',
						description: '通过在另一个页面中嵌入小部件或调用Webhook进行聊天',
					},
				],
				default: 'hostedChat',
				displayOptions: {
					show: {
						public: [true],
					},
				},
			},
			{
				displayName:
					'聊天将在激活此工作流后的上述URL上直播。激活后，实时执行将显示在“执行”选项卡中',
				name: 'hostedChatNotice',
				type: 'notice',
				default: '',
				displayOptions: {
					show: {
						mode: ['hostedChat'],
						public: [true],
					},
				},
			},
			{
				displayName:
					'跟随<a href="https://www.npmjs.com/package/@n8n/chat" target="_blank">此处</a>的说明将聊天嵌入网页中（或者只需调用本节顶部的Webhook URL）。激活此工作流后，聊天将直播',
				name: 'embeddedChatNotice',
				type: 'notice',
				default: '',
				displayOptions: {
					show: {
						mode: ['webhook'],
						public: [true],
					},
				},
			},
			{
				displayName: '身份验证',
				name: 'authentication',
				type: 'options',
				displayOptions: {
					show: {
						public: [true],
					},
				},
				options: [
					{
						name: '基本身份验证',
						value: 'basicAuth',
						description: '简单的用户名和密码（所有用户相同）',
					},
					{
						name: 'n8n用户身份验证',
						value: 'n8nUserAuth',
						description: '要求用户使用其n8n帐户登录',
					},
					{
						name: '无',
						value: 'none',
					},
				],
				default: 'none',
				description: '认证的方式',
			},
			{
				displayName: '初始消息',
				name: 'initialMessages',
				type: 'string',
				displayOptions: {
					show: {
						mode: ['hostedChat'],
						public: [true],
					},
				},
				typeOptions: {
					rows: 3,
				},
				default: 'Hi there! 👋\nMy name is Nathan. How can I assist you today?',
				description: '聊天开始时显示的默认消息，每行一个',
			},

			{
				displayName: '选项',
				name: 'options',
				type: 'collection',
				displayOptions: {
					show: {
						mode: ['hostedChat', 'webhook'],
						public: [true],
					},
				},
				placeholder: '添加字段',
				default: {},
				options: [
					{
						displayName: '输入占位符',
						name: 'inputPlaceholder',
						type: 'string',
						displayOptions: {
							show: {
								'/mode': ['hostedChat'],
							},
						},
						default: 'Type your question..',
						placeholder: '例如，请在此处输入您的消息',
						description: '在聊天输入字段中显示为占位符文本',
					},
					{
						displayName: '加载上一个会话',
						name: 'loadPreviousSession',
						type: 'options',
						options: [
							{
								name: '关闭',
								value: 'notSupported',
								description: '关闭加载上一个会话的消息',
							},
							{
								name: '从内存加载',
								value: 'memory',
								description: '从内存加载会话消息',
							},
							{
								name: '手动加载',
								value: 'manually',
								description: '手动返回会话的消息',
							},
						],
						default: 'notSupported',
						description: '是否启用加载上一个会话的消息',
					},
					{
						displayName: '响应模式',
						name: 'responseMode',
						type: 'options',
						options: [
							{
								name: '当最后一个节点完成时',
								value: 'lastNode',
								description: '返回最后执行的节点的数据',
							},
							{
								name: '使用“响应到Webhook”节点',
								value: 'responseNode',
								description: '在该节点中定义的响应',
							},
						],
						default: 'lastNode',
						description: '何时以及如何响应Webhook',
					},
					{
						displayName: '需要点击按钮才能开始聊天',
						name: 'showWelcomeScreen',
						type: 'boolean',
						displayOptions: {
							show: {
								'/mode': ['hostedChat'],
							},
						},
						default: false,
						description: '是否在聊天开始时显示欢迎屏幕',
					},
					{
						displayName: '开始对话按钮文本',
						name: 'getStarted',
						type: 'string',
						displayOptions: {
							show: {
								showWelcomeScreen: [true],
								'/mode': ['hostedChat'],
							},
						},
						default: 'New Conversation',
						placeholder: '例如，新对话',
						description: '作为欢迎屏幕的一部分，显示在聊天窗口中间',
					},
					{
						displayName: '副标题',
						name: 'subtitle',
						type: 'string',
						displayOptions: {
							show: {
								'/mode': ['hostedChat'],
							},
						},
						default: "Start a chat. We're here to help you 24/7.",
						placeholder: '例如，我们会为您提供帮助',
						description: '显示在聊天顶部，标题下',
					},
					{
						displayName: '标题',
						name: 'title',
						type: 'string',
						displayOptions: {
							show: {
								'/mode': ['hostedChat'],
							},
						},
						default: 'Hi there! 👋',
						placeholder: '例如，欢迎',
						description: '显示在聊天顶部',
					},
				],
			},
		],
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const res = this.getResponseObject();

		const isPublic = this.getNodeParameter('public', false) as boolean;
		const nodeMode = this.getNodeParameter('mode', 'hostedChat') as string;
		if (!isPublic) {
			res.status(404).end();
			return {
				noWebhookResponse: true,
			};
		}

		const webhookName = this.getWebhookName();
		const mode = this.getMode() === 'manual' ? 'test' : 'production';
		const bodyData = this.getBodyData() ?? {};

		const options = this.getNodeParameter('options', {}) as {
			getStarted?: string;
			inputPlaceholder?: string;
			loadPreviousSession?: LoadPreviousSessionChatOption;
			showWelcomeScreen?: boolean;
			subtitle?: string;
			title?: string;
		};

		if (nodeMode === 'hostedChat') {
			try {
				await validateAuth(this);
			} catch (error) {
				if (error) {
					res.writeHead((error as IDataObject).responseCode as number, {
						'www-authenticate': 'Basic realm="Webhook"',
					});
					res.end((error as IDataObject).message as string);
					return { noWebhookResponse: true };
				}
				throw error;
			}

			// Show the chat on GET request
			if (webhookName === 'setup') {
				const webhookUrlRaw = this.getNodeWebhookUrl('default') as string;
				const webhookUrl =
					mode === 'test' ? webhookUrlRaw.replace('/webhook', '/webhook-test') : webhookUrlRaw;
				const authentication = this.getNodeParameter('authentication') as
					| 'none'
					| 'basicAuth'
					| 'n8nUserAuth';
				const initialMessagesRaw = this.getNodeParameter('initialMessages', '') as string;
				const initialMessages = initialMessagesRaw
					.split('\n')
					.filter((line) => line)
					.map((line) => line.trim());
				const instanceId = this.getInstanceId();

				const i18nConfig = pick(options, ['getStarted', 'inputPlaceholder', 'subtitle', 'title']);

				const page = createPage({
					i18n: {
						en: i18nConfig,
					},
					showWelcomeScreen: options.showWelcomeScreen,
					loadPreviousSession: options.loadPreviousSession,
					initialMessages,
					webhookUrl,
					mode,
					instanceId,
					authentication,
				});

				res.status(200).send(page).end();
				return {
					noWebhookResponse: true,
				};
			}
		}

		if (bodyData.action === 'loadPreviousSession') {
			if (options?.loadPreviousSession === 'memory') {
				const memory = (await this.getInputConnectionData(NodeConnectionType.AiMemory, 0)) as
					| BaseChatMemory
					| undefined;
				const messages = ((await memory?.chatHistory.getMessages()) ?? [])
					.filter((message) => !message?.additional_kwargs?.hideFromUI)
					.map((message) => message?.toJSON());
				return {
					webhookResponse: { data: messages },
				};
			} else if (options?.loadPreviousSession === 'notSupported') {
				// If messages of a previous session should not be loaded, simply return an empty array
				return {
					webhookResponse: { data: [] },
				};
			}
		}

		const returnData: IDataObject = { ...bodyData };
		const webhookResponse: IDataObject = { status: 200 };
		return {
			webhookResponse,
			workflowData: [this.helpers.returnJsonArray(returnData)],
		};
	}
}
