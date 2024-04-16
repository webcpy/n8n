/* eslint-disable n8n-nodes-base/node-dirname-against-convention */
import {
	NodeConnectionType,
	type IDataObject,
	type IExecuteFunctions,
	type INodeExecutionData,
	type INodeType,
	type INodeTypeDescription,
} from 'n8n-workflow';
import type { BaseChatMemory } from '@langchain/community/memory/chat_memory';
import type { BaseMessage } from '@langchain/core/messages';

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

		return {
			json: simplified,
		};
	});
	return transformedMessages;
}

// This node is deprecated. Use MemoryManager instead.
export class MemoryChatRetriever implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Chat Messages Retriever',
		name: 'memoryChatRetriever',
		icon: 'fa:database',
		group: ['transform'],
		hidden: true,
		version: 1,
		description: '从存储中检索聊天消息并在工作流程中使用它们',
		defaults: {
			name: 'Chat Messages Retriever',
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
			NodeConnectionType.Main,
			{
				displayName: 'Memory',
				maxConnections: 1,
				type: NodeConnectionType.AiMemory,
				required: true,
			},
		],
		// eslint-disable-next-line n8n-nodes-base/node-class-description-outputs-wrong
		outputs: [NodeConnectionType.Main],
		properties: [
			{
				displayName: '此节点已弃用。请改用“聊天内存管理器”节点。',
				type: 'notice',
				default: '',
				name: 'deprecatedNotice',
			},
			{
				displayName: '简化输出',
				name: 'simplifyOutput',
				type: 'boolean',
				description: '是否简化输出，只包括发送者和文本',
				default: true,
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		this.logger.verbose('Executing Chat Memory Retriever');

		const memory = (await this.getInputConnectionData(NodeConnectionType.AiMemory, 0)) as
			| BaseChatMemory
			| undefined;
		const simplifyOutput = this.getNodeParameter('simplifyOutput', 0) as boolean;

		const messages = await memory?.chatHistory.getMessages();

		if (simplifyOutput && messages) {
			return await this.prepareOutputData(simplifyMessages(messages));
		}

		const serializedMessages =
			messages?.map((message) => {
				const serializedMessage = message.toJSON();
				return { json: serializedMessage as unknown as IDataObject };
			}) ?? [];

		return await this.prepareOutputData(serializedMessages);
	}
}
