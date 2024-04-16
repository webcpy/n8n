import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	JsonObject,
} from 'n8n-workflow';
import { jsonParse, NodeOperationError } from 'n8n-workflow';

const errorObjectPlaceholder = `{
	"code": "404",
	"description": "The resource could not be fetched"
}`;

export class StopAndError implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Stop and Error',
		name: 'stopAndError',
		icon: 'fa:exclamation-triangle',
		group: ['input'],
		version: 1,
		description: '在工作流程中抛出错误',
		defaults: {
			name: 'Stop and Error',
			color: '#ff0000',
		},
		inputs: ['main'],
		// eslint-disable-next-line n8n-nodes-base/node-class-description-outputs-wrong
		outputs: [],
		properties: [
			{
				"displayName": "错误类型",
				"name": "errorType",
				"type": "options",
				"options": [
					{
						"name": "错误消息",
						"value": "errorMessage"
					},
					{
						"name": "错误对象",
						"value": "errorObject"
					}
				],
				"default": "errorMessage",
				"description": "要抛出的错误类型"
			},
			{
				"displayName": "错误消息",
				"name": "errorMessage",
				"type": "string",
				"placeholder": "发生了错误！",
				"default": "",
				"required": true,
				"displayOptions": {
					"show": {
						"errorType": [
							"errorMessage"
						]
					}
				}
			},
			{
				"displayName": "错误对象",
				"name": "errorObject",
				"type": "json",
				"description": "包含错误属性的对象",
				"default": "",
				"typeOptions": {
					"alwaysOpenEditWindow": true
				},
				"placeholder": "errorObjectPlaceholder",
				"required": true,
				"displayOptions": {
					"show": {
						"errorType": [
							"errorObject"
						]
					}
				}
			}
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const errorType = this.getNodeParameter('errorType', 0) as 'errorMessage' | 'errorObject';
		const { id: workflowId, name: workflowName } = this.getWorkflow();

		let toThrow: string | JsonObject;

		if (errorType === 'errorMessage') {
			toThrow = this.getNodeParameter('errorMessage', 0) as string;
		} else {
			const json = this.getNodeParameter('errorObject', 0) as string;

			const errorObject = jsonParse<JsonObject>(json);

			toThrow = {
				name: 'User-thrown error',
				message: `Workflow ID ${workflowId} "${workflowName}" has failed`,
				...errorObject,
			};
		}

		throw new NodeOperationError(this.getNode(), toThrow);
	}
}
