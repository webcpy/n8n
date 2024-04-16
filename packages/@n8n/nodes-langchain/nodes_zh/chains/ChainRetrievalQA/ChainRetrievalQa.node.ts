import {
	NodeConnectionType,
	type IExecuteFunctions,
	type INodeExecutionData,
	type INodeType,
	type INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';

import { RetrievalQAChain } from 'langchain/chains';
import type { BaseLanguageModel } from '@langchain/core/language_models/base';
import type { BaseRetriever } from '@langchain/core/retrievers';
import { getTemplateNoticeField } from '../../../utils/sharedFields';
import { getPromptInputByType } from '../../../utils/helpers';
import { getTracingConfig } from '../../../utils/tracing';

export class ChainRetrievalQa implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Question and Answer Chain',
		name: 'chainRetrievalQa',
		icon: 'fa:link',
		group: ['transform'],
		version: [1, 1.1, 1.2, 1.3],
		description: '回答关于检索到文档的问题',
		defaults: {
			name: 'Question and Answer Chain',
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
						url: 'https://docs.n8n.io/integrations/builtin/cluster-nodes/root-nodes/n8n-nodes-langchain.chainretrievalqa/',
					},
				],
			},
		},
		// eslint-disable-next-line n8n-nodes-base/node-class-description-inputs-wrong-regular-node
		inputs: [
			NodeConnectionType.Main,
			{
				displayName: 'Model',
				maxConnections: 1,
				type: NodeConnectionType.AiLanguageModel,
				required: true,
			},
			{
				displayName: 'Retriever',
				maxConnections: 1,
				type: NodeConnectionType.AiRetriever,
				required: true,
			},
		],
		outputs: [NodeConnectionType.Main],
		credentials: [],
		properties: [
			getTemplateNoticeField(1960),
			{
				displayName: '查询',
				name: 'query',
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
				displayName: '查询',
				name: 'query',
				type: 'string',
				required: true,
				default: '={{ $json.chat_input }}',
				displayOptions: {
					show: {
						'@version': [1.1],
					},
				},
			},
			{
				displayName: '查询',
				name: 'query',
				type: 'string',
				required: true,
				default: '={{ $json.chatInput }}',
				displayOptions: {
					show: {
						'@version': [1.2],
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
						'@version': [{ _cnd: { lte: 1.2 } }],
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
				typeOptions: {
					rows: 2,
				},
				displayOptions: {
					show: {
						promptType: ['define'],
					},
				},
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		this.logger.verbose('Executing Retrieval QA Chain');

		const model = (await this.getInputConnectionData(
			NodeConnectionType.AiLanguageModel,
			0,
		)) as BaseLanguageModel;

		const retriever = (await this.getInputConnectionData(
			NodeConnectionType.AiRetriever,
			0,
		)) as BaseRetriever;

		const items = this.getInputData();
		const chain = RetrievalQAChain.fromLLM(model, retriever);

		const returnData: INodeExecutionData[] = [];

		// Run for each item
		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				let query;

				if (this.getNode().typeVersion <= 1.2) {
					query = this.getNodeParameter('query', itemIndex) as string;
				} else {
					query = getPromptInputByType({
						ctx: this,
						i: itemIndex,
						inputKey: 'text',
						promptTypeKey: 'promptType',
					});
				}

				if (query === undefined) {
					throw new NodeOperationError(this.getNode(), 'The ‘query‘ parameter is empty.');
				}

				const response = await chain.withConfig(getTracingConfig(this)).invoke({ query });
				returnData.push({ json: { response } });
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
