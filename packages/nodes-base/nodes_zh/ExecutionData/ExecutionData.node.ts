import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';

export class ExecutionData implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Execution Data',
		name: 'executionData',
		icon: 'fa:tasks',
		group: ['input'],
		version: 1,
		description: '为搜索添加执行数据',
		defaults: {
			name: 'Execution Data',
			color: '#29A568',
		},
		inputs: ['main'],
		outputs: ['main'],
		properties: [
			{
				"displayName": "使用此节点保存您想要稍后使用的字段，以便轻松查找执行（例如用户 ID）。您将能够在“执行”选项卡中按此数据搜索。<br>此功能在我们的专业版和企业版计划中提供。 <a href='https://n8n.io/pricing/' target='_blank'>更多信息</a>。",
				"name": "notice",
				"type": "notice",
				"default": ""
			},
			{
				"displayName": "操作",
				"name": "operation",
				"type": "options",
				"default": "save",
				"noDataExpression": true,
				"options": [
					{
						"name": "保存执行数据以供搜索",
						"value": "save",
						"action": "保存执行数据以供搜索"
					}
				]
			},
			{
				"displayName": "要保存的数据",
				"name": "dataToSave",
				"placeholder": "添加保存的字段",
				"type": "fixedCollection",
				"typeOptions": {
					"multipleValueButtonText": "添加保存的字段",
					"multipleValues": true
				},
				"displayOptions": {
					"show": {
						"operation": ["save"]
					}
				},
				"default": {},
				"options": [
					{
						"displayName": "值",
						"name": "values",
						"values": [
							{
								"displayName": "键",
								"name": "key",
								"type": "string",
								"default": "",
								"placeholder": "例如：myKey"
							},
							{
								"displayName": "值",
								"name": "value",
								"type": "string",
								"default": "",
								"placeholder": "例如：myValue"
							}
						]
					}
				]
			}
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const context = this.getWorkflowDataProxy(0);

		const items = this.getInputData();
		const operations = this.getNodeParameter('operation', 0);

		if (operations === 'save') {
			for (let i = 0; i < items.length; i++) {
				const dataToSave =
					((this.getNodeParameter('dataToSave', i, {}) as IDataObject).values as IDataObject[]) ||
					[];

				const values = dataToSave.reduce((acc, { key, value }) => {
					acc[key as string] = value;
					return acc;
				}, {} as IDataObject);

				context.$execution.customData.setAll(values);
			}
		}

		return [items];
	}
}
