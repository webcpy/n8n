/* eslint-disable n8n-nodes-base/node-dirname-against-convention */
import {
	NodeConnectionType,
	type IExecuteFunctions,
	type INodeType,
	type INodeTypeDescription,
	type SupplyData,
} from 'n8n-workflow';
import type {
	RecursiveCharacterTextSplitterParams,
	SupportedTextSplitterLanguage,
} from 'langchain/text_splitter';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { logWrapper } from '../../../utils/logWrapper';
import { getConnectionHintNoticeField } from '../../../utils/sharedFields';

const supportedLanguages: SupportedTextSplitterLanguage[] = [
	'cpp',
	'go',
	'java',
	'js',
	'php',
	'proto',
	'python',
	'rst',
	'ruby',
	'rust',
	'scala',
	'swift',
	'markdown',
	'latex',
	'html',
];
export class TextSplitterRecursiveCharacterTextSplitter implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Recursive Character Text Splitter',
		name: 'textSplitterRecursiveCharacterTextSplitter',
		icon: 'fa:grip-lines-vertical',
		group: ['transform'],
		version: 1,
		description: '以递归方式将文本按字符分割成块，推荐用于大多数情况。',
		defaults: {
			name: 'Recursive Character Text Splitter',
		},
		codex: {
			categories: ['AI'],
			subcategories: {
				AI: ['Text Splitters'],
			},
			resources: {
				primaryDocumentation: [
					{
						url: 'https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.textsplitterrecursivecharactertextsplitter/',
					},
				],
			},
		},
		// eslint-disable-next-line n8n-nodes-base/node-class-description-inputs-wrong-regular-node
		inputs: [],
		// eslint-disable-next-line n8n-nodes-base/node-class-description-outputs-wrong
		outputs: [NodeConnectionType.AiTextSplitter],
		outputNames: ['Text Splitter'],
		properties: [
			getConnectionHintNoticeField([NodeConnectionType.AiDocument]),
			{
				displayName: '分块大小',
				name: 'chunkSize',
				type: 'number',
				default: 1000,
			},
			{
				displayName: '分块重叠',
				name: 'chunkOverlap',
				type: 'number',
				default: 0,
			},
			{
				displayName: '选项',
				name: 'options',
				placeholder: '添加选项',
				description: '要添加的额外选项',
				type: 'collection',
				default: {},
				options: [
					{
						displayName: '分割代码',
						name: 'splitCode',
						default: 'markdown',
						type: 'options',
						options: [
							{
								name: 'markdown',
								value: 'markdown',
							},
							{
								name: 'javascript',
								value: 'javascript',
							},
							{
								name: 'python',
								value: 'python',
							},
							// 其他支持的语言
						],
					},
				],
			},
		],
	};

	async supplyData(this: IExecuteFunctions, itemIndex: number): Promise<SupplyData> {
		this.logger.verbose('Supply Data for Text Splitter');

		const chunkSize = this.getNodeParameter('chunkSize', itemIndex) as number;
		const chunkOverlap = this.getNodeParameter('chunkOverlap', itemIndex) as number;
		const splitCode = this.getNodeParameter(
			'options.splitCode',
			itemIndex,
			null,
		) as SupportedTextSplitterLanguage | null;
		const params: RecursiveCharacterTextSplitterParams = {
			// TODO: These are the default values, should we allow the user to change them?
			separators: ['\n\n', '\n', ' ', ''],
			chunkSize,
			chunkOverlap,
			keepSeparator: false,
		};
		let splitter: RecursiveCharacterTextSplitter;

		if (splitCode && supportedLanguages.includes(splitCode)) {
			splitter = RecursiveCharacterTextSplitter.fromLanguage(splitCode, params);
		} else {
			splitter = new RecursiveCharacterTextSplitter(params);
		}

		return {
			response: logWrapper(splitter, this),
		};
	}
}
