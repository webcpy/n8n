import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';

export class Start implements INodeType {
	description: INodeTypeDescription = {
		"displayName": "开始",
		"name": "start",
		"icon": "fa:play",
		"group": ["input"],
		"version": 1,
		"description": "从此节点开始执行工作流",
		"maxNodes": 1,
		"hidden": true,
		"defaults": {
			"name": "Start",
			"color": "#00e000"
		},
		"inputs": [],
		"outputs": ["main"],
		"properties": [
			{
				"displayName": "这是手动工作流执行开始的节点。要创建一个，请返回画布并单击“执行工作流”",
				"name": "notice",
				"type": "notice",
				"default": ""
			}
		]
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();

		return [items];
	}
}
