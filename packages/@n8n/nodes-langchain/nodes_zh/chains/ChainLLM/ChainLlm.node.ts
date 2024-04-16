import { ApplicationError, NodeConnectionType, NodeOperationError } from 'n8n-workflow';
import type {
	IBinaryData,
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';

import type { BaseLanguageModel } from '@langchain/core/language_models/base';
import {
	AIMessagePromptTemplate,
	PromptTemplate,
	SystemMessagePromptTemplate,
	HumanMessagePromptTemplate,
	ChatPromptTemplate,
} from '@langchain/core/prompts';
import type { BaseOutputParser } from '@langchain/core/output_parsers';
import { CombiningOutputParser } from 'langchain/output_parsers';
import { LLMChain } from 'langchain/chains';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { HumanMessage } from '@langchain/core/messages';
import { getTemplateNoticeField } from '../../../utils/sharedFields';
import {
	getOptionalOutputParsers,
	getPromptInputByType,
	isChatInstance,
} from '../../../utils/helpers';
import { getTracingConfig } from '../../../utils/tracing';

interface MessagesTemplate {
	type: string;
	message: string;
	messageType: 'text' | 'imageBinary' | 'imageUrl';
	binaryImageDataKey?: string;
	imageUrl?: string;
	imageDetail?: 'auto' | 'low' | 'high';
}

async function getImageMessage(
	context: IExecuteFunctions,
	itemIndex: number,
	message: MessagesTemplate,
) {
	if (message.messageType !== 'imageBinary' && message.messageType !== 'imageUrl') {
		// eslint-disable-next-line n8n-nodes-base/node-execute-block-wrong-error-thrown
		throw new NodeOperationError(
			context.getNode(),
			'Invalid message type. Only imageBinary and imageUrl are supported',
		);
	}
	const detail = message.imageDetail === 'auto' ? undefined : message.imageDetail;
	if (message.messageType === 'imageUrl' && message.imageUrl) {
		return new HumanMessage({
			content: [
				{
					type: 'image_url',
					image_url: {
						url: message.imageUrl,
						detail,
					},
				},
			],
		});
	}

	const binaryDataKey = message.binaryImageDataKey ?? 'data';
	const inputData = context.getInputData()[itemIndex];
	const binaryData = inputData.binary?.[binaryDataKey] as IBinaryData;

	if (!binaryData) {
		throw new NodeOperationError(context.getNode(), 'No binary data set.');
	}

	const bufferData = await context.helpers.getBinaryDataBuffer(itemIndex, binaryDataKey);
	return new HumanMessage({
		content: [
			{
				type: 'image_url',
				image_url: {
					url: `data:image/jpeg;base64,${bufferData.toString('base64')}`,
					detail,
				},
			},
		],
	});
}

async function getChainPromptTemplate(
	context: IExecuteFunctions,
	itemIndex: number,
	llm: BaseLanguageModel | BaseChatModel,
	messages?: MessagesTemplate[],
	formatInstructions?: string,
	query?: string,
) {
	const queryTemplate = new PromptTemplate({
		template: `{query}${formatInstructions ? '\n{formatInstructions}' : ''}`,
		inputVariables: ['query'],
		partialVariables: formatInstructions ? { formatInstructions } : undefined,
	});

	if (isChatInstance(llm)) {
		const parsedMessages = await Promise.all(
			(messages ?? []).map(async (message) => {
				const messageClass = [
					SystemMessagePromptTemplate,
					AIMessagePromptTemplate,
					HumanMessagePromptTemplate,
				].find((m) => m.lc_name() === message.type);

				if (!messageClass) {
					// eslint-disable-next-line n8n-nodes-base/node-execute-block-wrong-error-thrown
					throw new ApplicationError('Invalid message type', {
						extra: { messageType: message.type },
					});
				}

				if (messageClass === HumanMessagePromptTemplate && message.messageType !== 'text') {
					const test = await getImageMessage(context, itemIndex, message);
					return test;
				}

				const res = messageClass.fromTemplate(
					// Since we're using the message as template, we need to escape any curly braces
					// so LangChain doesn't try to parse them as variables
					(message.message || '').replace(/[{}]/g, (match) => match + match),
				);
				return res;
			}),
		);

		const lastMessage = parsedMessages[parsedMessages.length - 1];
		// If the last message is a human message and it has an array of content, we need to add the query to the last message
		if (lastMessage instanceof HumanMessage && Array.isArray(lastMessage.content)) {
			const humanMessage = new HumanMessagePromptTemplate(queryTemplate);
			const test = await humanMessage.format({ query });
			lastMessage.content.push({ text: test.content.toString(), type: 'text' });
		} else {
			parsedMessages.push(new HumanMessagePromptTemplate(queryTemplate));
		}
		return ChatPromptTemplate.fromMessages(parsedMessages);
	}

	return queryTemplate;
}

async function createSimpleLLMChain(
	context: IExecuteFunctions,
	llm: BaseLanguageModel,
	query: string,
	prompt: ChatPromptTemplate | PromptTemplate,
): Promise<string[]> {
	const chain = new LLMChain({
		llm,
		prompt,
	}).withConfig(getTracingConfig(context));

	const response = (await chain.invoke({
		query,
		signal: context.getExecutionCancelSignal(),
	})) as string[];

	return Array.isArray(response) ? response : [response];
}

async function getChain(
	context: IExecuteFunctions,
	itemIndex: number,
	query: string,
	llm: BaseLanguageModel,
	outputParsers: BaseOutputParser[],
	messages?: MessagesTemplate[],
): Promise<unknown[]> {
	const chatTemplate: ChatPromptTemplate | PromptTemplate = await getChainPromptTemplate(
		context,
		itemIndex,
		llm,
		messages,
		undefined,
		query,
	);

	// If there are no output parsers, create a simple LLM chain and execute the query
	if (!outputParsers.length) {
		return await createSimpleLLMChain(context, llm, query, chatTemplate);
	}

	// If there's only one output parser, use it; otherwise, create a combined output parser
	const combinedOutputParser =
		outputParsers.length === 1 ? outputParsers[0] : new CombiningOutputParser(...outputParsers);

	const formatInstructions = combinedOutputParser.getFormatInstructions();

	// Create a prompt template incorporating the format instructions and query
	const prompt = await getChainPromptTemplate(
		context,
		itemIndex,
		llm,
		messages,
		formatInstructions,
		query,
	);

	const chain = prompt.pipe(llm).pipe(combinedOutputParser);
	const response = (await chain.withConfig(getTracingConfig(context)).invoke({ query })) as
		| string
		| string[];

	return Array.isArray(response) ? response : [response];
}

function getInputs(parameters: IDataObject) {
	const hasOutputParser = parameters?.hasOutputParser;
	const inputs = [
		{ displayName: '', type: NodeConnectionType.Main },
		{
			displayName: 'Model',
			maxConnections: 1,
			type: NodeConnectionType.AiLanguageModel,
			required: true,
		},
	];

	// If `hasOutputParser` is undefined it must be version 1.3 or earlier so we
	// always add the output parser input
	if (hasOutputParser === undefined || hasOutputParser === true) {
		inputs.push({ displayName: 'Output Parser', type: NodeConnectionType.AiOutputParser });
	}
	return inputs;
}

export class ChainLlm implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Basic LLM Chain',
		name: 'chainLlm',
		icon: 'fa:link',
		group: ['transform'],
		version: [1, 1.1, 1.2, 1.3, 1.4],
		description: '触发一个大型语言模型的简单链条',
		defaults: {
			name: 'Basic LLM Chain',
			color: '#909298',
		},
		codex: {
			alias: ['LangChain'],
			categories: ['AI'],
			subcategories: {
				AI: ['Chains'],
			},
			resources: {
				primaryDocumentation: [
					{
						url: 'https://docs.n8n.io/integrations/builtin/cluster-nodes/root-nodes/n8n-nodes-langchain.chainllm/',
					},
				],
			},
		},
		inputs: `={{ ((parameter) => { ${getInputs.toString()}; return getInputs(parameter) })($parameter) }}`,
		outputs: [NodeConnectionType.Main],
		credentials: [],
		properties: [
			getTemplateNoticeField(1978),
			{
				displayName: '提示',
				name: 'prompt',
				type: 'string',
				required: true,
				default: '={{ $json.input }}',
				displayOptions: {
					show: {
						'@version': [1],
					},
				},
			},
			{
				displayName: '提示',
				name: 'prompt',
				type: 'string',
				required: true,
				default: '={{ $json.chat_input }}',
				displayOptions: {
					show: {
						'@version': [1.1, 1.2],
					},
				},
			},
			{
				displayName: '提示',
				name: 'prompt',
				type: 'string',
				required: true,
				default: '={{ $json.chatInput }}',
				displayOptions: {
					show: {
						'@version': [1.3],
					},
				},
			},
			{
				displayName: '提示类型',
				name: 'promptType',
				type: 'options',
				options: [
					{
						name: '从上一个节点自动获取',
						value: 'auto',
						description: '查找名为chatInput的输入字段',
					},
					{
						name: '在下面定义',
						value: 'define',
						description: '使用表达式引用前面节点中的数据或输入静态文本',
					},
				],
				displayOptions: {
					hide: {
						'@version': [1, 1.1, 1.2, 1.3],
					},
				},
				default: 'auto',
			},

			{
				displayName: '文本',
				name: 'text',
				type: 'string',
				required: true,
				default: '',
				placeholder: '例如：你好，你能帮助我吗？',
				typeOptions: {
					rows: 2,
				},
				displayOptions: {
					show: {
						promptType: ['define'],
					},
				},
			},
			{
				displayName: '是否需要指定的输出格式',
				name: 'hasOutputParser',
				type: 'boolean',
				default: false,
				noDataExpression: true,
				displayOptions: {
					hide: {
						'@version': [1, 1.1, 1.3],
					},
				},
			},
			{
				displayName: '聊天消息（如果使用聊天模型）',
				name: 'messages',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: true,
				},
				default: {},
				placeholder: '添加提示',
				options: [
					{
						name: 'messageValues',
						displayName: '提示',
						values: [
							{
								displayName: '输入名称或ID',
								name: 'type',
								type: 'options',
								options: [
									{
										name: 'AI',
										value: 'ai',
									},
									{
										name: '系统',
										value: 'system',
									},
									{
										name: '用户',
										value: 'user',
									},
								],
								default: 'system',
							},
							{
								displayName: '消息类型',
								name: 'messageType',
								type: 'options',
								displayOptions: {
									show: {
										type: ['user'],
									},
								},
								options: [
									{
										name: '文本',
										value: 'text',
										description: '简单的文本消息',
									},
									{
										name: '图像（二进制）',
										value: 'imageBinary',
										description: '处理前一个节点的二进制输入',
									},
									{
										name: '图像（URL）',
										value: 'imageUrl',
										description: '处理指定URL的图像',
									},
								],
								default: 'text',
							},
							{
								displayName: '图像数据字段名称',
								name: 'binaryImageDataKey',
								type: 'string',
								default: 'data',
								required: true,
								description: '链输入中包含要处理的二进制图像文件的字段的名称',
								displayOptions: {
									show: {
										messageType: ['imageBinary'],
									},
								},
							},
							{
								displayName: '图像URL',
								name: 'imageUrl',
								type: 'string',
								default: '',
								required: true,
								description: '要处理的图像的URL',
								displayOptions: {
									show: {
										messageType: ['imageUrl'],
									},
								},
							},
							{
								displayName: '图像详情',
								description: '控制模型如何处理图像并生成其文本理解',
								name: 'imageDetail',
								type: 'options',
								displayOptions: {
									show: {
										type: ['user'],
										messageType: ['imageBinary', 'imageUrl'],
									},
								},
								options: [
									{
										name: '自动',
										value: 'auto',
										description: '模型将使用自动设置，根据图像输入大小决定是否应使用低或高设置',
									},
									{
										name: '低',
										value: 'low',
										description:
											'模型将接收低分辨率512px x 512px版本的图像，并以65个令牌的预算表示图像。这允许API返回更快的响应，并消耗更少的输入令牌，适用于不需要高细节的用例。',
									},
									{
										name: '高',
										value: 'high',
										description:
											'允许模型查看低分辨率图像，然后根据输入图像大小创建详细的512px正方形的详细剪裁图像。每个详细的剪裁使用两倍的令牌预算（65个令牌），总共129个令牌。',
									},
								],
								default: 'auto',
							},
							{
								displayName: '消息',
								name: 'message',
								type: 'string',
								required: true,
								displayOptions: {
									hide: {
										messageType: ['imageBinary', 'imageUrl'],
									},
								},
								default: '',
							},
						],
					},
				],
			},

			{
				displayName:
					"在画布上连接一个<a data-action='openSelectiveNodeCreator' data-action-parameter-connectiontype='${NodeConnectionType.AiOutputParser}'>输出解析器</a>，以指定所需的输出格式",
				name: 'notice',
				type: 'notice',
				default: '',
				displayOptions: {
					show: {
						hasOutputParser: [true],
					},
				},
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		this.logger.verbose('Executing LLM Chain');
		const items = this.getInputData();

		const returnData: INodeExecutionData[] = [];
		const llm = (await this.getInputConnectionData(
			NodeConnectionType.AiLanguageModel,
			0,
		)) as BaseLanguageModel;

		const outputParsers = await getOptionalOutputParsers(this);

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				let prompt: string;
				if (this.getNode().typeVersion <= 1.3) {
					prompt = this.getNodeParameter('prompt', itemIndex) as string;
				} else {
					prompt = getPromptInputByType({
						ctx: this,
						i: itemIndex,
						inputKey: 'text',
						promptTypeKey: 'promptType',
					});
				}
				const messages = this.getNodeParameter(
					'messages.messageValues',
					itemIndex,
					[],
				) as MessagesTemplate[];

				if (prompt === undefined) {
					throw new NodeOperationError(this.getNode(), "The 'prompt' parameter is empty.");
				}

				const responses = await getChain(this, itemIndex, prompt, llm, outputParsers, messages);

				responses.forEach((response) => {
					let data: IDataObject;
					if (typeof response === 'string') {
						data = {
							response: {
								text: response.trim(),
							},
						};
					} else if (Array.isArray(response)) {
						data = {
							data: response,
						};
					} else if (response instanceof Object) {
						data = response as IDataObject;
					} else {
						data = {
							response: {
								text: response,
							},
						};
					}

					returnData.push({
						json: data,
					});
				});
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ json: { error: error.message }, pairedItem: { item: itemIndex } });
					continue;
				}

				throw error;
			}
		}

		return [returnData];
	}
}
