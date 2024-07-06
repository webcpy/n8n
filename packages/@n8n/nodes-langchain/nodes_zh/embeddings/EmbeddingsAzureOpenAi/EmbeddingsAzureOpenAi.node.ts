/* eslint-disable n8n-nodes-base/node-dirname-against-convention */
import {
	NodeConnectionType,
	type IExecuteFunctions,
	type INodeType,
	type INodeTypeDescription,
	type SupplyData,
} from 'n8n-workflow';

import { OpenAIEmbeddings } from '@langchain/openai';
import { logWrapper } from '../../../utils/logWrapper';
import { getConnectionHintNoticeField } from '../../../utils/sharedFields';

export class EmbeddingsAzureOpenAi implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Embeddings Azure OpenAI',
		name: 'embeddingsAzureOpenAi',
		icon: 'file:azure.svg',
		credentials: [
			{
				name: 'azureOpenAiApi',
				required: true,
			},
		],
		group: ['transform'],
		version: 1,
		description: 'Use Embeddings Azure OpenAI',
		defaults: {
			name: 'Embeddings Azure OpenAI',
		},

		codex: {
			categories: ['AI'],
			subcategories: {
				AI: ['Embeddings'],
			},
			resources: {
				primaryDocumentation: [
					{
						url: 'https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.embeddingsazureopenai/',
					},
				],
			},
		},
		// eslint-disable-next-line n8n-nodes-base/node-class-description-inputs-wrong-regular-node
		inputs: [],
		// eslint-disable-next-line n8n-nodes-base/node-class-description-outputs-wrong
		outputs: [NodeConnectionType.AiEmbedding],
		outputNames: ['Embeddings'],
		properties: [
			getConnectionHintNoticeField([NodeConnectionType.AiVectorStore]),
			{
				displayName: '模型（部署）名称',
				name: 'model',
				type: 'string',
				description: '要使用的模型（部署）的名称',
				default: '',
			},
			{
				displayName: '选项',
				name: 'options',
				placeholder: '添加选项',
				description: '要添加的附加选项',
				type: 'collection',
				default: {},
				options: [
					{
						displayName: '批处理大小',
						name: 'batchSize',
						default: 512,
						typeOptions: { maxValue: 2048 },
						description: '每个请求发送的文档的最大数量',
						type: 'number',
					},
					{
						displayName: '去除换行符',
						name: 'stripNewLines',
						default: true,
						description: '是否从输入文本中去除换行符',
						type: 'boolean',
					},
					{
						displayName: '超时',
						name: 'timeout',
						default: -1,
						description: '允许请求花费的最长时间（秒）。将其设置为-1表示没有超时。',
						type: 'number',
					},
				],
			},
		],
	};

	async supplyData(this: IExecuteFunctions, itemIndex: number): Promise<SupplyData> {
		this.logger.verbose('Supply data for embeddings');
		const credentials = (await this.getCredentials('azureOpenAiApi')) as {
			apiKey: string;
			resourceName: string;
			apiVersion: string;
		};
		const modelName = this.getNodeParameter('model', itemIndex) as string;

		const options = this.getNodeParameter('options', itemIndex, {}) as {
			batchSize?: number;
			stripNewLines?: boolean;
			timeout?: number;
		};

		if (options.timeout === -1) {
			options.timeout = undefined;
		}

		const embeddings = new OpenAIEmbeddings({
			azureOpenAIApiDeploymentName: modelName,
			azureOpenAIApiInstanceName: credentials.resourceName,
			azureOpenAIApiKey: credentials.apiKey,
			azureOpenAIApiVersion: credentials.apiVersion,
			...options,
		});

		return {
			response: logWrapper(embeddings, this),
		};
	}
}
