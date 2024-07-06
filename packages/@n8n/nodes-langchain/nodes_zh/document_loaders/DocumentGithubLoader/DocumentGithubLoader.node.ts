/* eslint-disable n8n-nodes-base/node-dirname-against-convention */
import {
	NodeConnectionType,
	type IExecuteFunctions,
	type INodeType,
	type INodeTypeDescription,
	type SupplyData,
} from 'n8n-workflow';
import { GithubRepoLoader } from 'langchain/document_loaders/web/github';
import type { CharacterTextSplitter } from 'langchain/text_splitter';
import { logWrapper } from '../../../utils/logWrapper';
import { getConnectionHintNoticeField } from '../../../utils/sharedFields';

export class DocumentGithubLoader implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'GitHub Document Loader',
		name: 'documentGithubLoader',
		icon: 'file:github.svg',
		group: ['transform'],
		version: 1,
		description: '将 GitHub 数据用作此链的输入。',
		defaults: {
			name: 'GitHub Document Loader',
		},
		codex: {
			categories: ['AI'],
			subcategories: {
				AI: ['Document Loaders'],
			},
			resources: {
				primaryDocumentation: [
					{
						url: 'https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.documentgithubloader/',
					},
				],
			},
		},
		credentials: [
			{
				name: 'githubApi',
				required: true,
			},
		],
		// eslint-disable-next-line n8n-nodes-base/node-class-description-inputs-wrong-regular-node
		inputs: [
			{
				displayName: 'Text Splitter',
				maxConnections: 1,
				type: NodeConnectionType.AiTextSplitter,
			},
		],
		inputNames: ['Text Splitter'],
		// eslint-disable-next-line n8n-nodes-base/node-class-description-outputs-wrong
		outputs: [NodeConnectionType.AiDocument],
		outputNames: ['Document'],
		properties: [
			getConnectionHintNoticeField([NodeConnectionType.AiVectorStore]),
			{
				displayName: '存储库链接',
				name: 'repository',
				type: 'string',
				default: '',
			},
			{
				displayName: '分支',
				name: 'branch',
				type: 'string',
				default: 'main',
			},
			{
				displayName: '选项',
				name: 'additionalOptions',
				type: 'collection',
				placeholder: '添加选项',
				default: {},
				options: [
					{
						displayName: '递归',
						name: 'recursive',
						type: 'boolean',
						default: false,
					},
					{
						displayName: '忽略路径',
						name: 'ignorePaths',
						type: 'string',
						description: '要忽略的路径的逗号分隔列表，例如"docs, src/tests"',
						default: '',
					},
				],
			},
		],
	};

	async supplyData(this: IExecuteFunctions, itemIndex: number): Promise<SupplyData> {
		console.log('Supplying data for Github Document Loader');

		const repository = this.getNodeParameter('repository', itemIndex) as string;
		const branch = this.getNodeParameter('branch', itemIndex) as string;
		const credentials = await this.getCredentials('githubApi');
		const { ignorePaths, recursive } = this.getNodeParameter('additionalOptions', 0) as {
			recursive: boolean;
			ignorePaths: string;
		};

		const textSplitter = (await this.getInputConnectionData(
			NodeConnectionType.AiTextSplitter,
			0,
		)) as CharacterTextSplitter | undefined;

		const docs = new GithubRepoLoader(repository, {
			branch,
			ignorePaths: (ignorePaths ?? '').split(',').map((p) => p.trim()),
			recursive,
			accessToken: (credentials.accessToken as string) || '',
		});

		const loadedDocs = textSplitter ? await docs.loadAndSplit(textSplitter) : await docs.load();

		return {
			response: logWrapper(loadedDocs, this),
		};
	}
}
