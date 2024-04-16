/* eslint-disable n8n-nodes-base/node-dirname-against-convention */
import {
	NodeConnectionType,
	type IExecuteFunctions,
	type INodeType,
	type INodeTypeDescription,
	type SupplyData,
} from 'n8n-workflow';
import { logWrapper } from '../../../utils/logWrapper';
import { getConnectionHintNoticeField } from '../../../utils/sharedFields';
import { ItemListOutputParser } from './ItemListOutputParser';

export class OutputParserItemList implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Item List Output Parser',
		name: 'outputParserItemList',
		icon: 'fa:bars',
		group: ['transform'],
		version: 1,
		description: '将结果作为单独的项返回',
		defaults: {
			name: 'Item List Output Parser',
		},

		codex: {
			categories: ['AI'],
			subcategories: {
				AI: ['Output Parsers'],
			},
			resources: {
				primaryDocumentation: [
					{
						url: 'https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.outputparseritemlist/',
					},
				],
			},
		},
		// eslint-disable-next-line n8n-nodes-base/node-class-description-inputs-wrong-regular-node
		inputs: [],
		// eslint-disable-next-line n8n-nodes-base/node-class-description-outputs-wrong
		outputs: [NodeConnectionType.AiOutputParser],
		outputNames: ['Output Parser'],
		properties: [
			getConnectionHintNoticeField([NodeConnectionType.AiChain, NodeConnectionType.AiAgent]),
			{
				displayName: '选项',
				name: 'options',
				type: 'collection',
				placeholder: '添加选项',
				default: {},
				options: [
					{
						displayName: '项目数量',
						name: 'numberOfItems',
						type: 'number',
						default: -1,
						description: '定义最多应返回多少项。如果设置为-1，则没有限制。',
					},
					{
						displayName: '分隔符',
						name: 'separator',
						type: 'string',
						default: '\\n',
						description:
							'定义用于将结果拆分为单独项的分隔符。默认为换行符，但可以根据应返回的数据进行更改。',
					},
				],
			},
		],
	};

	async supplyData(this: IExecuteFunctions, itemIndex: number): Promise<SupplyData> {
		const options = this.getNodeParameter('options', itemIndex, {}) as {
			numberOfItems?: number;
			separator?: string;
		};

		const parser = new ItemListOutputParser(options);

		return {
			response: logWrapper(parser, this),
		};
	}
}
