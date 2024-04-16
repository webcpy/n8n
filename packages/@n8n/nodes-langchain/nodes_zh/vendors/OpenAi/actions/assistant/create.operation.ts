import type {
	INodeProperties,
	IExecuteFunctions,
	INodeExecutionData,
	IDataObject,
} from 'n8n-workflow';
import { NodeOperationError, updateDisplayOptions } from 'n8n-workflow';
import { apiRequest } from '../../transport';
import { modelRLC } from '../descriptions';

const properties: INodeProperties[] = [
	modelRLC,
	{
		displayName: '名称',
		name: 'name',
		type: 'string',
		default: '',
		description: '助手的名称。最大长度为256个字符。',
		placeholder: '例如：我的助手',
		required: true,
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
		displayName: '代码解释器',
		name: 'codeInterpreter',
		type: 'boolean',
		default: false,
		// eslint-disable-next-line n8n-nodes-base/node-param-description-boolean-without-whether
		description:
			'是否启用代码解释器，允许助手在沙盒执行环境中编写和运行Python代码，更多信息请查看<a href="https://platform.openai.com/docs/assistants/tools/code-interpreter" target="_blank">这里</a>',
	},
	{
		displayName: '知识检索',
		name: 'knowledgeRetrieval',
		type: 'boolean',
		default: false,
		// eslint-disable-next-line n8n-nodes-base/node-param-description-boolean-without-whether
		description:
			'是否从模型外部获取知识，例如专有产品信息或文档，更多信息请查看<a href="https://platform.openai.com/docs/assistants/tools/knowledge-retrieval" target="_blank">这里</a>',
	},
	//we want to display Files selector only when codeInterpreter true or knowledgeRetrieval true or both
	{
		// eslint-disable-next-line n8n-nodes-base/node-param-display-name-wrong-for-dynamic-multi-options
		displayName: '文件',
		name: 'file_ids',
		type: 'multiOptions',
		// eslint-disable-next-line n8n-nodes-base/node-param-description-wrong-for-dynamic-multi-options
		description: '助手使用的文件，最多可以附加20个文件到助手',
		typeOptions: {
			loadOptionsMethod: 'getFiles',
		},
		default: [],
		hint: "使用'上传文件'操作添加更多文件",
		displayOptions: {
			show: {
				codeInterpreter: [true],
			},
			hide: {
				knowledgeRetrieval: [true],
			},
		},
	},
	{
		// eslint-disable-next-line n8n-nodes-base/node-param-display-name-wrong-for-dynamic-multi-options
		displayName: '文件',
		name: 'file_ids',
		type: 'multiOptions',
		// eslint-disable-next-line n8n-nodes-base/node-param-description-wrong-for-dynamic-multi-options
		description: '助手使用的文件，最多可以附加20个文件到助手',
		typeOptions: {
			loadOptionsMethod: 'getFiles',
		},
		default: [],
		hint: "使用'上传文件'操作添加更多文件",
		displayOptions: {
			show: {
				knowledgeRetrieval: [true],
			},
			hide: {
				codeInterpreter: [true],
			},
		},
	},
	{
		// eslint-disable-next-line n8n-nodes-base/node-param-display-name-wrong-for-dynamic-multi-options
		displayName: '文件',
		name: 'file_ids',
		type: 'multiOptions',
		// eslint-disable-next-line n8n-nodes-base/node-param-description-wrong-for-dynamic-multi-options
		description: '助手使用的文件，最多可以附加20个文件到助手',
		typeOptions: {
			loadOptionsMethod: 'getFiles',
		},
		default: [],
		hint: "使用'上传文件'操作添加更多文件",
		displayOptions: {
			show: {
				knowledgeRetrieval: [true],
				codeInterpreter: [true],
			},
		},
	},
	{
		displayName: '当您给助手<i>发送消息</i>时添加自定义 n8n 工具（而不是在创建时添加）',
		name: 'noticeTools',
		type: 'notice',
		default: '',
	},
	{
		displayName: '选项',
		name: 'options',
		placeholder: '添加选项',
		type: 'collection',
		default: {},
		options: [
			{
				displayName: '如果助手已存在则失败',
				name: 'failIfExists',
				type: 'boolean',
				default: false,
				// eslint-disable-next-line n8n-nodes-base/node-param-description-boolean-without-whether
				description: '如果同名助手已存在，是否失败',
			},
		],
	},
];

const displayOptions = {
	show: {
		operation: ['create'],
		resource: ['assistant'],
	},
};

export const description = updateDisplayOptions(displayOptions, properties);

export async function execute(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
	const model = this.getNodeParameter('modelId', i, '', { extractValue: true }) as string;
	const name = this.getNodeParameter('name', i) as string;
	const assistantDescription = this.getNodeParameter('description', i) as string;
	const instructions = this.getNodeParameter('instructions', i) as string;
	const codeInterpreter = this.getNodeParameter('codeInterpreter', i) as boolean;
	const knowledgeRetrieval = this.getNodeParameter('knowledgeRetrieval', i) as boolean;
	const file_ids = this.getNodeParameter('file_ids', i, []) as string[];
	const options = this.getNodeParameter('options', i, {});

	if (options.failIfExists) {
		const assistants: string[] = [];

		let has_more = true;
		let after: string | undefined;

		do {
			const response = (await apiRequest.call(this, 'GET', '/assistants', {
				headers: {
					'OpenAI-Beta': 'assistants=v1',
				},
				qs: {
					limit: 100,
					after,
				},
			})) as { data: IDataObject[]; has_more: boolean; last_id: string };

			for (const assistant of response.data || []) {
				assistants.push(assistant.name as string);
			}

			has_more = response.has_more;

			if (has_more) {
				after = response.last_id;
			} else {
				break;
			}
		} while (has_more);

		if (assistants.includes(name)) {
			throw new NodeOperationError(
				this.getNode(),
				`An assistant with the same name '${name}' already exists`,
				{ itemIndex: i },
			);
		}
	}

	if (file_ids.length > 20) {
		throw new NodeOperationError(
			this.getNode(),
			'The maximum number of files that can be attached to the assistant is 20',
			{ itemIndex: i },
		);
	}

	const body: IDataObject = {
		model,
		name,
		description: assistantDescription,
		instructions,
		file_ids,
	};

	const tools = [];

	if (codeInterpreter) {
		tools.push({
			type: 'code_interpreter',
		});
	}

	if (knowledgeRetrieval) {
		tools.push({
			type: 'retrieval',
		});
	}

	if (tools.length) {
		body.tools = tools;
	}

	const response = await apiRequest.call(this, 'POST', '/assistants', {
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
