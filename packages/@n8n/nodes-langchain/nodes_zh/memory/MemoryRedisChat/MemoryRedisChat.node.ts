/* eslint-disable n8n-nodes-base/node-dirname-against-convention */
import {
	NodeOperationError,
	type IExecuteFunctions,
	type INodeType,
	type INodeTypeDescription,
	type SupplyData,
	NodeConnectionType,
} from 'n8n-workflow';
import { BufferMemory } from 'langchain/memory';
import type { RedisChatMessageHistoryInput } from '@langchain/redis';
import { RedisChatMessageHistory } from '@langchain/redis';
import type { RedisClientOptions } from 'redis';
import { createClient } from 'redis';
import { logWrapper } from '../../../utils/logWrapper';
import { getConnectionHintNoticeField } from '../../../utils/sharedFields';
import { sessionIdOption, sessionKeyProperty } from '../descriptions';
import { getSessionId } from '../../../utils/helpers';

export class MemoryRedisChat implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Redis Chat Memory',
		name: 'memoryRedisChat',
		icon: 'file:redis.svg',
		group: ['transform'],
		version: [1, 1.1, 1.2],
		description: '以定义的 JSON 格式返回数据.',
		defaults: {
			name: 'Redis Chat Memory',
		},
		credentials: [
			{
				name: 'redis',
				required: true,
			},
		],
		codex: {
			categories: ['AI'],
			subcategories: {
				AI: ['Memory'],
			},
			resources: {
				primaryDocumentation: [
					{
						url: 'https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.memoryredischat/',
					},
				],
			},
		},
		// eslint-disable-next-line n8n-nodes-base/node-class-description-inputs-wrong-regular-node
		inputs: [],
		// eslint-disable-next-line n8n-nodes-base/node-class-description-outputs-wrong
		outputs: [NodeConnectionType.AiMemory],
		outputNames: ['Memory'],
		properties: [
			getConnectionHintNoticeField([NodeConnectionType.AiAgent]),
			{
				displayName: '会话键',
				name: 'sessionKey',
				type: 'string',
				default: 'chat_history',
				description: '用于在工作流数据中存储内存的键',
				displayOptions: {
					show: {
						'@version': [1],
					},
				},
			},
			{
				displayName: '会话ID',
				name: 'sessionKey',
				type: 'string',
				default: '={{ $json.sessionId }}',
				description: '用于存储会话ID的键',
				displayOptions: {
					show: {
						'@version': [1.1],
					},
				},
			},

			{
				...sessionIdOption,
				displayOptions: {
					show: {
						'@version': [{ _cnd: { gte: 1.2 } }],
					},
				},
			},
			sessionKeyProperty,
			{
				displayName: '会话存活时间',
				name: 'sessionTTL',
				type: 'number',
				default: 0,
				description: '会话应在多长时间内以秒为单位存储。如果设置为0，则不会过期。',
			},
		],
	};

	async supplyData(this: IExecuteFunctions, itemIndex: number): Promise<SupplyData> {
		const credentials = await this.getCredentials('redis');
		const nodeVersion = this.getNode().typeVersion;

		const sessionTTL = this.getNodeParameter('sessionTTL', itemIndex, 0) as number;

		let sessionId;

		if (nodeVersion >= 1.2) {
			sessionId = getSessionId(this, itemIndex);
		} else {
			sessionId = this.getNodeParameter('sessionKey', itemIndex) as string;
		}

		const redisOptions: RedisClientOptions = {
			socket: {
				host: credentials.host as string,
				port: credentials.port as number,
			},
			database: credentials.database as number,
		};

		if (credentials.password) {
			redisOptions.password = credentials.password as string;
		}

		const client = createClient({
			...redisOptions,
		});

		client.on('error', async (error: Error) => {
			await client.quit();
			throw new NodeOperationError(this.getNode(), 'Redis Error: ' + error.message);
		});

		const redisChatConfig: RedisChatMessageHistoryInput = {
			client,
			sessionId,
		};

		if (sessionTTL > 0) {
			redisChatConfig.sessionTTL = sessionTTL;
		}
		const redisChatHistory = new RedisChatMessageHistory(redisChatConfig);

		const memory = new BufferMemory({
			memoryKey: 'chat_history',
			chatHistory: redisChatHistory,
			returnMessages: true,
			inputKey: 'input',
			outputKey: 'output',
		});

		async function closeFunction() {
			void client.disconnect();
		}

		return {
			closeFunction,
			response: logWrapper(memory, this),
		};
	}
}
