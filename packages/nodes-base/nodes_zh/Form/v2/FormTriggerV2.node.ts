/* eslint-disable n8n-nodes-base/node-filename-against-convention */
import {
	type INodeType,
	type INodeTypeBaseDescription,
	type INodeTypeDescription,
	type IWebhookFunctions,
} from 'n8n-workflow';

import { formWebhook } from '../utils';
import {
	formDescription,
	formFields,
	formRespondMode,
	formTitle,
	formTriggerPanel,
	respondWithOptions,
	webhookPath,
} from '../common.descriptions';

const descriptionV2: INodeTypeDescription = {
	displayName: 'n8n 表单触发器',
	name: 'formTrigger',
	icon: 'file:form.svg',
	group: ['trigger'],
	version: 2,
	description: '当一个由n8n生成的网络表单被提交时，会运行相应的流程',
	defaults: {
		name: 'n8n Form Trigger',
	},
	// eslint-disable-next-line n8n-nodes-base/node-class-description-inputs-wrong-regular-node
	inputs: [],
	outputs: ['main'],
	webhooks: [
		{
			name: 'setup',
			httpMethod: 'GET',
			responseMode: 'onReceived',
			isFullPath: true,
			path: '={{$parameter["path"]}}',
			ndvHideUrl: true,
			isForm: true,
		},
		{
			name: 'default',
			httpMethod: 'POST',
			responseMode: '={{$parameter["responseMode"]}}',
			responseData: '={{$parameter["responseMode"] === "lastNode" ? "noData" : undefined}}',
			isFullPath: true,
			path: '={{$parameter["path"]}}',
			ndvHideMethod: true,
			isForm: true,
		},
	],
	eventTriggerDescription: '等待您提交表单',
	activationMessage: '现在您可以调用您的生产表单 URL。',
	triggerPanel: formTriggerPanel,
	properties: [
		webhookPath,
		formTitle,
		formDescription,
		formFields,
		formRespondMode,
		{
			"displayName": "在'响应到 Webhook'节点中，选择'JSON 响应'，并设置<strong>formSubmittedText</strong>键以在表单中显示自定义响应，或设置<strong>redirectURL</strong>键以将用户重定向到 URL",
			"name": "formNotice",
			"type": "notice",
			"displayOptions": {
				"show": { "responseMode": ["responseNode"] }
			},
			"default": ""
		},
		{
			"displayName": "选项",
			"name": "options",
			"type": "collection",
			"placeholder": "添加选项",
			"default": {},
			"displayOptions": {
				"hide": { "responseMode": ["responseNode"] }
			},
			"options": [respondWithOptions]
		}
	],
};

export class FormTriggerV2 implements INodeType {
	description: INodeTypeDescription;

	constructor(baseDescription: INodeTypeBaseDescription) {
		this.description = {
			...baseDescription,
			...descriptionV2,
		};
	}

	async webhook(this: IWebhookFunctions) {
		return await formWebhook(this);
	}
}
