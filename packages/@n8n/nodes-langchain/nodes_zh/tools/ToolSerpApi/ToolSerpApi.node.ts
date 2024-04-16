/* eslint-disable n8n-nodes-base/node-dirname-against-convention */
import {
	NodeConnectionType,
	type IExecuteFunctions,
	type INodeType,
	type INodeTypeDescription,
	type SupplyData,
} from 'n8n-workflow';
import { SerpAPI } from '@langchain/community/tools/serpapi';
import { logWrapper } from '../../../utils/logWrapper';
import { getConnectionHintNoticeField } from '../../../utils/sharedFields';

export class ToolSerpApi implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'SerpApi (Google Search)',
		name: 'toolSerpApi',
		icon: 'file:serpApi.svg',
		group: ['transform'],
		version: 1,
		description: '使用SerpAPI在Google中进行搜索',
		defaults: {
			name: 'SerpAPI',
		},
		codex: {
			categories: ['AI'],
			subcategories: {
				AI: ['Tools'],
			},
			resources: {
				primaryDocumentation: [
					{
						url: 'https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.toolserpapi/',
					},
				],
			},
		},
		// eslint-disable-next-line n8n-nodes-base/node-class-description-inputs-wrong-regular-node
		inputs: [],
		// eslint-disable-next-line n8n-nodes-base/node-class-description-outputs-wrong
		outputs: [NodeConnectionType.AiTool],
		outputNames: ['Tool'],
		credentials: [
			{
				name: 'serpApi',
				required: true,
			},
		],
		properties: [
			getConnectionHintNoticeField([NodeConnectionType.AiAgent]),
			{
				displayName: '选项',
				name: 'options',
				type: 'collection',
				placeholder: '添加选项',
				default: {},
				options: [
					{
						displayName: '国家',
						name: 'gl',
						type: 'string',
						default: 'us',
						description:
							'定义用于搜索的国家。请访问<a href="https://serpapi.com/google-countries">Google国家页面</a>查看支持的国家列表。',
					},
					{
						displayName: '设备',
						name: 'device',
						type: 'options',
						options: [
							{
								name: '桌面',
								value: 'desktop',
							},
							{
								name: '移动设备',
								value: 'mobile',
							},
							{
								name: '平板',
								value: 'tablet',
							},
						],
						default: 'desktop',
						description: '用于获取结果的设备',
					},
					{
						displayName: '显式数组',
						name: 'no_cache',
						type: 'boolean',
						default: false,
						description:
							'是否强制SerpApi获取Google结果，即使已经存在缓存版本。缓存在1小时后过期。缓存搜索是免费的，并且不计入每月搜索次数。',
					},
					{
						displayName: 'Google域名',
						name: 'google_domain',
						type: 'string',
						default: 'google.com',
						description:
							'定义用于搜索的域名。请访问<a href="https://serpapi.com/google-domains">Google域名页面</a>查看支持的域名列表。',
					},
					{
						displayName: '语言',
						name: 'hl',
						type: 'string',
						default: 'en',
						description:
							'定义要使用的语言。这是一个两字母的语言代码。(例如，`en`表示英语，`es`表示西班牙语，或`fr`表示法语)。请访问<a href="https://serpapi.com/google-languages">Google语言页面</a>查看支持的语言列表。',
					},
				],
			},
		],
	};

	async supplyData(this: IExecuteFunctions, itemIndex: number): Promise<SupplyData> {
		const credentials = await this.getCredentials('serpApi');

		const options = this.getNodeParameter('options', itemIndex) as object;

		return {
			response: logWrapper(new SerpAPI(credentials.apiKey as string, options), this),
		};
	}
}
