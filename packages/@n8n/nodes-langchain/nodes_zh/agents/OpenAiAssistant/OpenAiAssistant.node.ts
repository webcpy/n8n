import { AgentExecutor } from 'langchain/agents';
import { OpenAI as OpenAIClient } from 'openai';
import { OpenAIAssistantRunnable } from 'langchain/experimental/openai_assistant';
import { NodeConnectionType, NodeOperationError } from 'n8n-workflow';
import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import type { OpenAIToolType } from 'langchain/dist/experimental/openai_assistant/schema';
import { getConnectedTools } from '../../../utils/helpers';
import { getTracingConfig } from '../../../utils/tracing';
import { formatToOpenAIAssistantTool } from './utils';

export class OpenAiAssistant implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'OpenAI Assistant',
		name: 'openAiAssistant',
		hidden: true,
		icon: 'fa:robot',
		group: ['transform'],
		version: [1, 1.1],
		description: '利用OpenAI的Assistant API.',
		subtitle: 'Open AI Assistant',
		defaults: {
			name: 'OpenAI Assistant',
			color: '#404040',
		},
		codex: {
			alias: ['LangChain'],
			categories: ['AI'],
			subcategories: {
				AI: ['Agents'],
			},
			resources: {
				primaryDocumentation: [
					{
						url: 'https://docs.n8n.io/integrations/builtin/cluster-nodes/root-nodes/n8n-nodes-langchain.openaiassistant/',
					},
				],
			},
		},
		inputs: [
			{ type: NodeConnectionType.Main },
			{ type: NodeConnectionType.AiTool, displayName: 'Tools' },
		],
		outputs: [NodeConnectionType.Main],
		credentials: [
			{
				name: 'openAiApi',
				required: true,
			},
		],
		requestDefaults: {
			ignoreHttpStatusErrors: true,
			baseURL:
				'={{ $parameter.options?.baseURL?.split("/").slice(0,-1).join("/") || "https://api.openai.com" }}',
		},
		properties: [
			{
				displayName: '操作',
				name: 'mode',
				type: 'options',
				noDataExpression: true,
				default: 'existing',
				options: [
					{
						name: '使用新助手',
						value: 'new',
					},
					{
						name: '使用现有助手',
						value: 'existing',
					},
				],
			},
			{
				displayName: '名称',
				name: 'name',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						'/mode': ['new'],
					},
				},
			},
			{
				displayName: '说明',
				name: 'instructions',
				type: 'string',
				description: '助手和模型的行为或响应方式',
				default: '',
				typeOptions: {
					rows: 5,
				},
				displayOptions: {
					show: {
						'/mode': ['new'],
					},
				},
			},
			{
				displayName: '模型',
				name: 'model',
				type: 'options',
				description:
					'用于为助手提供动力的模型。<a href="https://beta.openai.com/docs/models/overview">了解更多</a>。检索工具需要 gpt-3.5-turbo-1106 和 gpt-4-1106-preview 模型。',
				required: true,
				displayOptions: {
					show: {
						'/mode': ['new'],
					},
				},
				typeOptions: {
					loadOptions: {
						routing: {
							request: {
								method: 'GET',
								url: '={{ $parameter.options?.baseURL?.split("/").slice(-1).pop() || "v1" }}/models',
							},
							output: {
								postReceive: [
									{
										type: 'rootProperty',
										properties: {
											property: 'data',
										},
									},
									{
										type: 'filter',
										properties: {
											pass: "={{ $responseItem.id.startsWith('gpt-') && !$responseItem.id.includes('instruct') }}",
										},
									},
									{
										type: 'setKeyValue',
										properties: {
											name: '={{$responseItem.id}}',
											value: '={{$responseItem.id}}',
										},
									},
									{
										type: 'sort',
										properties: {
											key: 'name',
										},
									},
								],
							},
						},
					},
				},
				routing: {
					send: {
						type: 'body',
						property: 'model',
					},
				},
				default: 'gpt-3.5-turbo-1106',
			},
			{
				displayName: '助手',
				name: 'assistantId',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						'/mode': ['existing'],
					},
				},
				description:
					'要使用的助手。<a href="https://beta.openai.com/docs/assistants/overview">了解更多</a>。',
				typeOptions: {
					loadOptions: {
						routing: {
							request: {
								method: 'GET',
								headers: {
									'OpenAI-Beta': 'assistants=v1',
								},
								url: '={{ $parameter.options?.baseURL?.split("/").slice(-1).pop() || "v1" }}/assistants',
							},
							output: {
								postReceive: [
									{
										type: 'rootProperty',
										properties: {
											property: 'data',
										},
									},
									{
										type: 'setKeyValue',
										properties: {
											name: '={{$responseItem.name}}',
											value: '={{$responseItem.id}}',
											description: '={{$responseItem.model}}',
										},
									},
									{
										type: 'sort',
										properties: {
											key: 'name',
										},
									},
								],
							},
						},
					},
				},
				routing: {
					send: {
						type: 'body',
						property: 'assistant',
					},
				},
				required: true,
				default: '',
			},

			{
				displayName: '文本',
				name: 'text',
				type: 'string',
				required: true,
				default: '={{ $json.chat_input }}',
				displayOptions: {
					show: {
						'@version': [1],
					},
				},
			},
			{
				displayName: '文本',
				name: 'text',
				type: 'string',
				required: true,
				default: '={{ $json.chatInput }}',
				displayOptions: {
					show: {
						'@version': [1.1],
					},
				},
			},
			{
				displayName: 'OpenAI 工具',
				name: 'nativeTools',
				type: 'multiOptions',
				default: [],
				options: [
					{
						name: '代码解释器',
						value: 'code_interpreter',
					},
					{
						name: '知识检索',
						value: 'retrieval',
					},
				],
			},
			{
				displayName: '在画布上将自定义工具连接到此节点',
				name: 'noticeTools',
				type: 'notice',
				default: '',
			},
			{
				displayName:
					'上传文件以使用<a href="https://platform.openai.com/playground" target="_blank">OpenAI 网站</a>进行检索',
				name: 'noticeTools',
				type: 'notice',
				typeOptions: {
					noticeTheme: 'info',
				},
				displayOptions: {
					show: {
						'/nativeTools': ['retrieval'],
					},
				},
				default: '',
			},
			{
				displayName: '选项',
				name: 'options',
				placeholder: '添加选项',
				description: '要添加的其他选项',
				type: 'collection',
				default: {},
				options: [
					{
						displayName: '基础 URL',
						name: 'baseURL',
						default: 'https://api.openai.com/v1',
						description: 'API 的默认基础 URL',
						type: 'string',
					},
					{
						displayName: '最大重试次数',
						name: 'maxRetries',
						default: 2,
						description: '要尝试的最大重试次数',
						type: 'number',
					},
					{
						displayName: '超时',
						name: 'timeout',
						default: 10000,
						description: '请求允许的最长时间（以毫秒为单位）',
						type: 'number',
					},
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const nodeVersion = this.getNode().typeVersion;
		const tools = await getConnectedTools(this, nodeVersion > 1);
		const credentials = await this.getCredentials('openAiApi');

		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				const input = this.getNodeParameter('text', itemIndex) as string;
				const assistantId = this.getNodeParameter('assistantId', itemIndex, '') as string;
				const nativeTools = this.getNodeParameter('nativeTools', itemIndex, []) as Array<
					'code_interpreter' | 'retrieval'
				>;

				const options = this.getNodeParameter('options', itemIndex, {}) as {
					baseURL?: string;
					maxRetries: number;
					timeout: number;
				};

				if (input === undefined) {
					throw new NodeOperationError(this.getNode(), 'The ‘text‘ parameter is empty.');
				}

				const client = new OpenAIClient({
					apiKey: credentials.apiKey as string,
					maxRetries: options.maxRetries ?? 2,
					timeout: options.timeout ?? 10000,
					baseURL: options.baseURL,
				});
				let agent;
				const nativeToolsParsed: OpenAIToolType = nativeTools.map((tool) => ({ type: tool }));
				const transformedConnectedTools = tools?.map(formatToOpenAIAssistantTool) ?? [];
				const newTools = [...transformedConnectedTools, ...nativeToolsParsed];

				// Existing agent, update tools with currently assigned
				if (assistantId) {
					agent = new OpenAIAssistantRunnable({ assistantId, client, asAgent: true });

					await client.beta.assistants.update(assistantId, {
						tools: newTools,
					});
				} else {
					const name = this.getNodeParameter('name', itemIndex, '') as string;
					const instructions = this.getNodeParameter('instructions', itemIndex, '') as string;
					const model = this.getNodeParameter('model', itemIndex, 'gpt-3.5-turbo-1106') as string;

					agent = await OpenAIAssistantRunnable.createAssistant({
						model,
						client,
						instructions,
						name,
						tools: newTools,
						asAgent: true,
					});
				}

				const agentExecutor = AgentExecutor.fromAgentAndTools({
					agent,
					tools,
				});

				const response = await agentExecutor.withConfig(getTracingConfig(this)).invoke({
					content: input,
					signal: this.getExecutionCancelSignal(),
					timeout: options.timeout ?? 10000,
				});

				returnData.push({ json: response });
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ json: { error: error.message }, pairedItem: { item: itemIndex } });
					continue;
				}

				throw error;
			}
		}

		return await this.prepareOutputData(returnData);
	}
}
