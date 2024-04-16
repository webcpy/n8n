/* eslint-disable n8n-nodes-base/node-dirname-against-convention */
import {
	NodeConnectionType,
	type IExecuteFunctions,
	type INodeType,
	type INodeTypeDescription,
	type SupplyData,
} from 'n8n-workflow';

import { MultiQueryRetriever } from 'langchain/retrievers/multi_query';
import type { BaseLanguageModel } from '@langchain/core/language_models/base';
import type { BaseRetriever } from '@langchain/core/retrievers';

import { logWrapper } from '../../../utils/logWrapper';

export class RetrieverMultiQuery implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'MultiQuery Retriever',
		name: 'retrieverMultiQuery',
		icon: 'fa:box-open',
		group: ['transform'],
		version: 1,
		description: `自动调整提示，生成多样化查询并扩展文档池，以增强检索。`,
		defaults: {
			name: 'MultiQuery Retriever',
		},
		codex: {
			categories: ['AI'],
			subcategories: {
				AI: ['Retrievers'],
			},
			resources: {
				primaryDocumentation: [
					{
						url: 'https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.retrievermultiquery/',
					},
				],
			},
		},
		// eslint-disable-next-line n8n-nodes-base/node-class-description-inputs-wrong-regular-node
		inputs: [
			{
				displayName: '模型',
				maxConnections: 1,
				type: NodeConnectionType.AiLanguageModel,
				required: true,
			},
			{
				displayName: '检索器',
				maxConnections: 1,
				type: NodeConnectionType.AiRetriever,
				required: true,
			},
		],
		outputs: [
			{
				displayName: 'Retriever',
				maxConnections: 1,
				type: NodeConnectionType.AiRetriever,
			},
		],
		properties: [
			{
				displayName: '选项',
				name: 'options',
				placeholder: '添加选项',
				description: '要添加的额外选项',
				type: 'collection',
				default: {},
				options: [
					{
						displayName: '查询计数',
						name: 'queryCount',
						default: 3,
						typeOptions: { minValue: 1 },
						description: '要生成的给定问题的不同版本的数量',
						type: 'number',
					},
				],
			},
		],
	};

	async supplyData(this: IExecuteFunctions, itemIndex: number): Promise<SupplyData> {
		this.logger.verbose('Supplying data for MultiQuery Retriever');

		const options = this.getNodeParameter('options', itemIndex, {}) as { queryCount?: number };

		const model = (await this.getInputConnectionData(
			NodeConnectionType.AiLanguageModel,
			itemIndex,
		)) as BaseLanguageModel;

		const baseRetriever = (await this.getInputConnectionData(
			NodeConnectionType.AiRetriever,
			itemIndex,
		)) as BaseRetriever;

		// TODO: Add support for parserKey

		const retriever = MultiQueryRetriever.fromLLM({
			llm: model,
			retriever: baseRetriever,
			...options,
		});

		return {
			response: logWrapper(retriever, this),
		};
	}
}
