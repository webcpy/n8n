import type {
	INodeProperties,
	IExecuteFunctions,
	INodeExecutionData,
	IDataObject,
} from 'n8n-workflow';
import { NodeOperationError, updateDisplayOptions } from 'n8n-workflow';
import { apiRequest } from '../../transport';
import { assistantRLC, modelRLC } from '../descriptions';

const properties: INodeProperties[] = [
	assistantRLC,
	{
		displayName: '选项',
		name: 'options',
		placeholder: '添加选项',
		type: 'collection',
		default: {},
		options: [
			{
				displayName: '代码解释器',
				name: 'codeInterpreter',
				type: 'boolean',
				default: false,
				description:
					'是否启用代码解释器，允许助手在沙盒执行环境中编写和运行Python代码，更多信息请查看<a href="https://platform.openai.com/docs/assistants/tools/code-interpreter" target="_blank">这里</a>',
			},
			{
				displayName: '描述',
				name: 'description',
				type: 'string',
				default: '',
				description: '助手的描述。最大长度为512个字符。',
				placeholder: '例如：我的个人助手',
			},
			{
				displayName: '文件',
				name: 'file_ids',
				type: 'multiOptions',
				description: '助手使用的文件，最多可以附加20个文件到助手',
				typeOptions: {
					loadOptionsMethod: 'getFiles',
				},
				default: [],
				hint: "使用'上传文件'操作添加更多文件，未在此处选择的任何现有文件将被删除。",
			},
			{
				displayName: '说明',
				name: 'instructions',
				type: 'string',
				description: '助手使用的系统说明。最大长度为32768个字符。',
				default: '',
				typeOptions: {
					rows: 2,
				},
			},
			{
				displayName: '知识检索',
				name: 'knowledgeRetrieval',
				type: 'boolean',
				default: false,
				description:
					'是否从模型外部获取知识，例如专有产品信息或文档，更多信息请查看<a href="https://platform.openai.com/docs/assistants/tools/knowledge-retrieval" target="_blank">这里</a>',
			},
			{ ...modelRLC, required: false },

			{
				displayName: '名称',
				name: 'name',
				type: 'string',
				default: '',
				description: '助手的名称。最大长度为256个字符。',
				placeholder: '例如：我的助手',
			},
			{
				displayName: '移除所有自定义工具（函数）',
				name: 'removeCustomTools',
				type: 'boolean',
				default: false,
				description: '是否删除助手中的所有自定义工具（函数）',
			},
		],
	},
];

const displayOptions = {
	show: {
		operation: ['update'],
		resource: ['assistant'],
	},
};

export const description = updateDisplayOptions(displayOptions, properties);

export async function execute(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
	const assistantId = this.getNodeParameter('assistantId', i, '', { extractValue: true }) as string;
	const options = this.getNodeParameter('options', i, {});

	const {
		modelId,
		name,
		instructions,
		codeInterpreter,
		knowledgeRetrieval,
		file_ids,
		removeCustomTools,
	} = options;

	const assistantDescription = options.description as string;

	const body: IDataObject = {};

	if (file_ids) {
		if ((file_ids as IDataObject[]).length > 20) {
			throw new NodeOperationError(
				this.getNode(),
				'The maximum number of files that can be attached to the assistant is 20',
				{ itemIndex: i },
			);
		}

		body.file_ids = file_ids;
	}

	if (modelId) {
		body.model = this.getNodeParameter('options.modelId', i, '', { extractValue: true }) as string;
	}

	if (name) {
		body.name = name;
	}

	if (assistantDescription) {
		body.description = assistantDescription;
	}

	if (instructions) {
		body.instructions = instructions;
	}

	let tools =
		((
			await apiRequest.call(this, 'GET', `/assistants/${assistantId}`, {
				headers: {
					'OpenAI-Beta': 'assistants=v1',
				},
			})
		).tools as IDataObject[]) || [];

	if (codeInterpreter && !tools.find((tool) => tool.type === 'code_interpreter')) {
		tools.push({
			type: 'code_interpreter',
		});
	}

	if (codeInterpreter === false && tools.find((tool) => tool.type === 'code_interpreter')) {
		tools = tools.filter((tool) => tool.type !== 'code_interpreter');
	}

	if (knowledgeRetrieval && !tools.find((tool) => tool.type === 'retrieval')) {
		tools.push({
			type: 'retrieval',
		});
	}

	if (knowledgeRetrieval === false && tools.find((tool) => tool.type === 'retrieval')) {
		tools = tools.filter((tool) => tool.type !== 'retrieval');
	}

	if (removeCustomTools) {
		tools = tools.filter((tool) => tool.type !== 'function');
	}

	body.tools = tools;

	const response = await apiRequest.call(this, 'POST', `/assistants/${assistantId}`, {
		body,
		headers: {
			'OpenAI-Beta': 'assistants=v1',
		},
	});

	return [
		{
			json: response,
			pairedItem: { item: i },
		},
	];
}
