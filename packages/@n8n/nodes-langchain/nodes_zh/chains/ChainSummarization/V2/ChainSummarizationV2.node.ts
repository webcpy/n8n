import { NodeConnectionType } from 'n8n-workflow';
import type {
	INodeTypeBaseDescription,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IDataObject,
} from 'n8n-workflow';

import { loadSummarizationChain } from 'langchain/chains';
import type { BaseLanguageModel } from '@langchain/core/language_models/base';
import type { Document } from '@langchain/core/documents';
import type { TextSplitter } from 'langchain/text_splitter';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { N8nJsonLoader } from '../../../../utils/N8nJsonLoader';
import { N8nBinaryLoader } from '../../../../utils/N8nBinaryLoader';
import { getTemplateNoticeField } from '../../../../utils/sharedFields';
import { REFINE_PROMPT_TEMPLATE, DEFAULT_PROMPT_TEMPLATE } from '../prompt';
import { getChainPromptsArgs } from '../helpers';
import { getTracingConfig } from '../../../../utils/tracing';

function getInputs(parameters: IDataObject) {
	const chunkingMode = parameters?.chunkingMode;
	const operationMode = parameters?.operationMode;
	const inputs = [
		{ displayName: '', type: NodeConnectionType.Main },
		{
			displayName: 'Model',
			maxConnections: 1,
			type: NodeConnectionType.AiLanguageModel,
			required: true,
		},
	];

	if (operationMode === 'documentLoader') {
		inputs.push({
			displayName: 'Document',
			type: NodeConnectionType.AiDocument,
			required: true,
			maxConnections: 1,
		});
		return inputs;
	}

	if (chunkingMode === 'advanced') {
		inputs.push({
			displayName: 'Text Splitter',
			type: NodeConnectionType.AiTextSplitter,
			required: false,
			maxConnections: 1,
		});
		return inputs;
	}
	return inputs;
}

export class ChainSummarizationV2 implements INodeType {
	description: INodeTypeDescription;

	constructor(baseDescription: INodeTypeBaseDescription) {
		this.description = {
			...baseDescription,
			version: [2],
			defaults: {
				name: 'Summarization Chain',
				color: '#909298',
			},
			// eslint-disable-next-line n8n-nodes-base/node-class-description-inputs-wrong-regular-node
			inputs: `={{ ((parameter) => { ${getInputs.toString()}; return getInputs(parameter) })($parameter) }}`,
			outputs: [NodeConnectionType.Main],
			credentials: [],
			properties: [
				getTemplateNoticeField(1951),
				{
					displayName: '数据摘要',
					name: 'operationMode',
					noDataExpression: true,
					type: 'options',
					description: '如何将数据传递到摘要链中',
					default: 'nodeInputJson',
					options: [
						{
							name: '使用节点输入（JSON）',
							value: 'nodeInputJson',
							description: '摘要来自上一个节点到该节点的JSON数据',
						},
						{
							name: '使用节点输入（二进制）',
							value: 'nodeInputBinary',
							description: '摘要来自上一个节点到该节点的二进制数据',
						},
						{
							name: '使用文档加载器',
							value: 'documentLoader',
							description: '使用具有更多配置选项的加载器子节点',
						},
					],
				},
				{
					displayName: '分块策略',
					name: 'chunkingMode',
					noDataExpression: true,
					type: 'options',
					description: '分块拆分策略',
					default: 'simple',
					options: [
						{
							name: '简单（在下面定义）',
							value: 'simple',
						},
						{
							name: '高级',
							value: 'advanced',
							description: '使用具有更多配置选项的拆分器子节点',
						},
					],
					displayOptions: {
						show: {
							'/operationMode': ['nodeInputJson', 'nodeInputBinary'],
						},
					},
				},
				{
					displayName: '每块字符数',
					name: 'chunkSize',
					description: '控制最终文档块的最大大小（以字符数计）',
					type: 'number',
					default: 1000,
					displayOptions: {
						show: {
							'/chunkingMode': ['simple'],
						},
					},
				},
				{
					displayName: '分块重叠（字符）',
					name: 'chunkOverlap',
					type: 'number',
					description: '指定块之间应有多少字符重叠',
					default: 200,
					displayOptions: {
						show: {
							'/chunkingMode': ['simple'],
						},
					},
				},

				{
					displayName: '选项',
					name: 'options',
					type: 'collection',
					default: {},
					placeholder: '添加选项',
					options: [
						{
							displayName: '输入数据字段名称',
							name: 'binaryDataKey',
							type: 'string',
							default: 'data',
							description: '包含要处理的二进制文件的代理或链输入中的字段的名称',
							displayOptions: {
								show: {
									'/operationMode': ['nodeInputBinary'],
								},
							},
						},
						{
							displayName: '摘要方法和提示',
							name: 'summarizationMethodAndPrompts',
							type: 'fixedCollection',
							default: {
								values: {
									summarizationMethod: 'map_reduce',
									prompt: DEFAULT_PROMPT_TEMPLATE,
									combineMapPrompt: DEFAULT_PROMPT_TEMPLATE,
								},
							},
							placeholder: '添加选项',
							typeOptions: {},
							options: [
								{
									name: 'values',
									displayName: 'Values',
									values: [
										{
											displayName: '摘要方法',
											name: 'summarizationMethod',
											type: 'options',
											description: '要运行的摘要类型',
											default: 'map_reduce',
											options: [
												{
													name: '映射减少（推荐）',
													value: 'map_reduce',
													description: '逐个摘要每个文档（或块），然后摘要这些摘要',
												},
												{
													name: '改进',
													value: 'refine',
													description:
														'摘要第一个文档（或块）。然后根据下一个文档（或块）更新该摘要，并重复该过程。',
												},
												{
													name: '填充',
													value: 'stuff',
													description: '一次传递所有文档（或块）。适用于小型数据集。',
												},
											],
										},
										{
											displayName: '个人摘要提示',
											name: 'combineMapPrompt',
											type: 'string',
											hint: '摘要单个文档（或块）的提示',
											displayOptions: {
												hide: {
													'/options.summarizationMethodAndPrompts.values.summarizationMethod': [
														'stuff',
														'refine',
													],
												},
											},
											default: DEFAULT_PROMPT_TEMPLATE,
											typeOptions: {
												rows: 9,
											},
										},
										{
											displayName: '最终组合提示',
											name: 'prompt',
											type: 'string',
											default: DEFAULT_PROMPT_TEMPLATE,
											hint: '组合个别摘要的提示',
											displayOptions: {
												hide: {
													'/options.summarizationMethodAndPrompts.values.summarizationMethod': [
														'stuff',
														'refine',
													],
												},
											},
											typeOptions: {
												rows: 9,
											},
										},
										{
											displayName: '提示',
											name: 'prompt',
											type: 'string',
											default: DEFAULT_PROMPT_TEMPLATE,
											displayOptions: {
												hide: {
													'/options.summarizationMethodAndPrompts.values.summarizationMethod': [
														'refine',
														'map_reduce',
													],
												},
											},
											typeOptions: {
												rows: 9,
											},
										},
										{
											displayName: '后续（改进）提示',
											name: 'refinePrompt',
											type: 'string',
											displayOptions: {
												hide: {
													'/options.summarizationMethodAndPrompts.values.summarizationMethod': [
														'stuff',
														'map_reduce',
													],
												},
											},
											default: REFINE_PROMPT_TEMPLATE,
											hint: '根据下一个文档（或块）调整摘要的提示',
											typeOptions: {
												rows: 9,
											},
										},
										{
											displayName: '初始提示',
											name: 'refineQuestionPrompt',
											type: 'string',
											displayOptions: {
												hide: {
													'/options.summarizationMethodAndPrompts.values.summarizationMethod': [
														'stuff',
														'map_reduce',
													],
												},
											},
											default: DEFAULT_PROMPT_TEMPLATE,
											hint: '第一个文档（或块）的提示',
											typeOptions: {
												rows: 9,
											},
										},
									],
								},
							],
						},
					],
				},
			],
		};
	}

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		this.logger.verbose('Executing Summarization Chain V2');
		const operationMode = this.getNodeParameter('operationMode', 0, 'nodeInputJson') as
			| 'nodeInputJson'
			| 'nodeInputBinary'
			| 'documentLoader';
		const chunkingMode = this.getNodeParameter('chunkingMode', 0, 'simple') as
			| 'simple'
			| 'advanced';

		const model = (await this.getInputConnectionData(
			NodeConnectionType.AiLanguageModel,
			0,
		)) as BaseLanguageModel;

		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				const summarizationMethodAndPrompts = this.getNodeParameter(
					'options.summarizationMethodAndPrompts.values',
					itemIndex,
					{},
				) as {
					prompt?: string;
					refineQuestionPrompt?: string;
					refinePrompt?: string;
					summarizationMethod: 'map_reduce' | 'stuff' | 'refine';
					combineMapPrompt?: string;
				};

				const chainArgs = getChainPromptsArgs(
					summarizationMethodAndPrompts.summarizationMethod ?? 'map_reduce',
					summarizationMethodAndPrompts,
				);

				const chain = loadSummarizationChain(model, chainArgs);
				const item = items[itemIndex];

				let processedDocuments: Document[];

				// Use dedicated document loader input to load documents
				if (operationMode === 'documentLoader') {
					const documentInput = (await this.getInputConnectionData(
						NodeConnectionType.AiDocument,
						0,
					)) as N8nJsonLoader | Array<Document<Record<string, unknown>>>;

					const isN8nLoader =
						documentInput instanceof N8nJsonLoader || documentInput instanceof N8nBinaryLoader;

					processedDocuments = isN8nLoader
						? await documentInput.processItem(item, itemIndex)
						: documentInput;

					const response = await chain.withConfig(getTracingConfig(this)).invoke({
						input_documents: processedDocuments,
					});

					returnData.push({ json: { response } });
				}

				// Take the input and use binary or json loader
				if (['nodeInputJson', 'nodeInputBinary'].includes(operationMode)) {
					let textSplitter: TextSplitter | undefined;

					switch (chunkingMode) {
						// In simple mode we use recursive character splitter with default settings
						case 'simple':
							const chunkSize = this.getNodeParameter('chunkSize', itemIndex, 1000) as number;
							const chunkOverlap = this.getNodeParameter('chunkOverlap', itemIndex, 200) as number;

							textSplitter = new RecursiveCharacterTextSplitter({ chunkOverlap, chunkSize });
							break;

						// In advanced mode user can connect text splitter node so we just retrieve it
						case 'advanced':
							textSplitter = (await this.getInputConnectionData(
								NodeConnectionType.AiTextSplitter,
								0,
							)) as TextSplitter | undefined;
							break;
						default:
							break;
					}

					let processor: N8nJsonLoader | N8nBinaryLoader;
					if (operationMode === 'nodeInputBinary') {
						const binaryDataKey = this.getNodeParameter(
							'options.binaryDataKey',
							itemIndex,
							'data',
						) as string;
						processor = new N8nBinaryLoader(this, 'options.', binaryDataKey, textSplitter);
					} else {
						processor = new N8nJsonLoader(this, 'options.', textSplitter);
					}

					const processedItem = await processor.processItem(item, itemIndex);
					const response = await chain.call({
						input_documents: processedItem,
					});
					returnData.push({ json: { response } });
				}
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
