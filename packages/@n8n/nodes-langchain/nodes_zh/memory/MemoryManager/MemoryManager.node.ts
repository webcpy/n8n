/* eslint-disable n8n-nodes-base/node-dirname-against-convention */
import { NodeConnectionType } from 'n8n-workflow';
import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import type { BaseChatMemory } from '@langchain/community/memory/chat_memory';
import { AIMessage, SystemMessage, HumanMessage, type BaseMessage } from '@langchain/core/messages';

type MessageRole = 'ai' | 'system' | 'user';
interface MessageRecord {
	type: MessageRole;
	message: string;
	hideFromUI: boolean;
}

function simplifyMessages(messages: BaseMessage[]) {
	const chunkedMessages = [];
	for (let i = 0; i < messages.length; i += 2) {
		chunkedMessages.push([messages[i], messages[i + 1]]);
	}

	const transformedMessages = chunkedMessages.map((exchange) => {
		const simplified = {
			[exchange[0]._getType()]: exchange[0].content,
		};

		if (exchange[1]) {
			simplified[exchange[1]._getType()] = exchange[1].content;
		}

		return simplified;
	});
	return transformedMessages;
}

const prepareOutputSetup = (ctx: IExecuteFunctions, version: number, memory: BaseChatMemory) => {
	if (version === 1) {
		//legacy behavior of insert and delete for version 1
		return async (i: number) => {
			const messages = await memory.chatHistory.getMessages();

			const serializedMessages = messages?.map((message) => message.toJSON()) ?? [];

			const executionData = ctx.helpers.constructExecutionMetaData(
				ctx.helpers.returnJsonArray(serializedMessages as unknown as IDataObject[]),
				{ itemData: { item: i } },
			);

			return executionData;
		};
	}
	return async (i: number) => {
		return [
			{
				json: { success: true },
				pairedItem: { item: i },
			},
		];
	};
};

export class MemoryManager implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Chat Memory Manager',
		name: 'memoryManager',
		icon: 'fa:database',
		group: ['transform'],
		version: [1, 1.1],
		description: '管理聊天消息的存储并在工作流程中使用它',
		defaults: {
			name: 'Chat Memory Manager',
		},
		codex: {
			categories: ['AI'],
			subcategories: {
				AI: ['Miscellaneous'],
			},
			resources: {
				primaryDocumentation: [
					{
						url: 'https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.memorymanager/',
					},
				],
			},
		},
		// eslint-disable-next-line n8n-nodes-base/node-class-description-inputs-wrong-regular-node
		inputs: [
			{
				displayName: '',
				type: NodeConnectionType.Main,
			},
			{
				displayName: 'Memory',
				type: NodeConnectionType.AiMemory,
				required: true,
				maxConnections: 1,
			},
		],
		// eslint-disable-next-line n8n-nodes-base/node-class-description-outputs-wrong
		outputs: [
			{
				displayName: '',
				type: NodeConnectionType.Main,
			},
		],
		properties: [
			{
				displayName: '操作模式',
				name: 'mode',
				type: 'options',
				noDataExpression: true,
				default: 'load',
				options: [
					{
						name: '获取多条消息',
						description: '从连接的内存中检索聊天消息',
						value: 'load',
					},
					{
						name: '插入消息',
						description: '将聊天消息插入到连接的内存中',
						value: 'insert',
					},
					{
						name: '删除消息',
						description: '从连接的内存中删除聊天消息',
						value: 'delete',
					},
				],
			},
			{
				displayName: '插入模式',
				name: 'insertMode',
				type: 'options',
				description: '选择如何将新消息插入到内存中',
				noDataExpression: true,
				default: 'insert',
				options: [
					{
						name: '插入消息',
						value: 'insert',
						description: '将消息添加到现有消息旁边',
					},
					{
						name: '覆盖所有消息',
						value: 'override',
						description: '用新消息替换当前内存中的所有消息',
					},
				],
				displayOptions: {
					show: {
						mode: ['insert'],
					},
				},
			},
			{
				displayName: '删除模式',
				name: 'deleteMode',
				type: 'options',
				description: '从内存中删除消息的方式',
				noDataExpression: true,
				default: 'lastN',
				options: [
					{
						name: '最后N条',
						value: 'lastN',
						description: '删除最后N条消息',
					},
					{
						name: '所有消息',
						value: 'all',
						description: '清除内存中的所有消息',
					},
				],
				displayOptions: {
					show: {
						mode: ['delete'],
					},
				},
			},
			{
				displayName: '聊天消息',
				name: 'messages',
				description: '要插入到内存中的聊天消息',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: true,
				},
				default: {},
				placeholder: '添加消息',
				options: [
					{
						name: 'messageValues',
						displayName: '消息',
						values: [
							{
								displayName: '类型名称或ID',
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
								displayName: '消息',
								name: 'message',
								type: 'string',
								required: true,
								default: '',
							},
							{
								displayName: '在聊天中隐藏消息',
								name: 'hideFromUI',
								type: 'boolean',
								required: true,
								default: false,
								description: '是否将消息从聊天界面中隐藏',
							},
						],
					},
				],
				displayOptions: {
					show: {
						mode: ['insert'],
					},
				},
			},

			{
				displayName: '消息数量',
				name: 'lastMessagesCount',
				type: 'number',
				description: '要删除的最后消息的数量',
				default: 2,
				displayOptions: {
					show: {
						mode: ['delete'],
						deleteMode: ['lastN'],
					},
				},
			},
			{
				displayName: '简化输出',
				name: 'simplifyOutput',
				type: 'boolean',
				description: '是否简化输出，只包括发送者和文本',
				default: true,
				displayOptions: {
					show: {
						mode: ['load'],
					},
				},
			},
			{
				displayName: '选项',
				name: 'options',
				placeholder: '添加选项',
				type: 'collection',
				default: {},
				options: [
					{
						displayName: '分组消息',
						name: 'groupMessages',
						type: 'boolean',
						default: true,
						description: '是否将消息分组为单个项目或将每条消息作为单独的项目返回',
					},
				],
				displayOptions: {
					show: {
						mode: ['load'],
					},
				},
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const nodeVersion = this.getNode().typeVersion;
		const items = this.getInputData();
		const mode = this.getNodeParameter('mode', 0, 'load') as 'load' | 'insert' | 'delete';
		const memory = (await this.getInputConnectionData(
			NodeConnectionType.AiMemory,
			0,
		)) as BaseChatMemory;

		const prepareOutput = prepareOutputSetup(this, nodeVersion, memory);

		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			const messages = await memory.chatHistory.getMessages();

			if (mode === 'delete') {
				const deleteMode = this.getNodeParameter('deleteMode', i) as 'lastN' | 'all';

				if (deleteMode === 'lastN') {
					const lastMessagesCount = this.getNodeParameter('lastMessagesCount', i) as number;
					if (messages.length >= lastMessagesCount) {
						const newMessages = messages.slice(0, messages.length - lastMessagesCount);

						await memory.chatHistory.clear();
						for (const message of newMessages) {
							await memory.chatHistory.addMessage(message);
						}
					}
				} else {
					await memory.chatHistory.clear();
				}

				returnData.push(...(await prepareOutput(i)));
			}

			if (mode === 'insert') {
				const insertMode = this.getNodeParameter('insertMode', i) as 'insert' | 'override';
				const messagesToInsert = this.getNodeParameter(
					'messages.messageValues',
					i,
					[],
				) as MessageRecord[];

				const templateMapper = {
					ai: AIMessage,
					system: SystemMessage,
					user: HumanMessage,
				};

				if (insertMode === 'override') {
					await memory.chatHistory.clear();
				}

				for (const message of messagesToInsert) {
					const MessageClass = new templateMapper[message.type](message.message);

					if (message.hideFromUI) {
						MessageClass.additional_kwargs.hideFromUI = true;
					}

					await memory.chatHistory.addMessage(MessageClass);
				}

				returnData.push(...(await prepareOutput(i)));
			}

			if (mode === 'load') {
				const simplifyOutput = this.getNodeParameter('simplifyOutput', i, false) as boolean;
				const options = this.getNodeParameter('options', i);

				//Load mode, legacy behavior for version 1, buggy - outputs only for single input item
				if (simplifyOutput && messages.length && nodeVersion === 1) {
					const groupMessages = options.groupMessages as boolean;
					const output = simplifyMessages(messages);

					return [
						this.helpers.constructExecutionMetaData(
							this.helpers.returnJsonArray(
								groupMessages ? [{ messages: output, messagesCount: output.length }] : output,
							),
							{ itemData: { item: i } },
						),
					];
				}

				let groupMessages = true;
				//disable grouping if explicitly set to false
				if (options.groupMessages === false) {
					groupMessages = false;
				}
				//disable grouping if not set and node version is 1 (legacy behavior)
				if (options.groupMessages === undefined && nodeVersion === 1) {
					groupMessages = false;
				}

				let output: IDataObject[] =
					(simplifyOutput
						? simplifyMessages(messages)
						: (messages?.map((message) => message.toJSON()) as unknown as IDataObject[])) ?? [];

				if (groupMessages) {
					output = [{ messages: output, messagesCount: output.length }];
				}

				const executionData = this.helpers.constructExecutionMetaData(
					this.helpers.returnJsonArray(output),
					{ itemData: { item: i } },
				);

				returnData.push(...executionData);
			}
		}

		return [returnData];
	}
}
