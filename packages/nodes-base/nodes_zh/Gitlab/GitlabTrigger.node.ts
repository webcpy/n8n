import type {
	IHookFunctions,
	IWebhookFunctions,
	IDataObject,
	INodeType,
	INodeTypeDescription,
	IWebhookResponseData,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';

import { gitlabApiRequest } from './GenericFunctions';

const GITLAB_EVENTS = [
	{
		"name": "评论",
		"value": "note",
		"description": "当对提交、合并请求、问题和代码片段进行新评论时触发"
	},
	{
		"name": "机密问题",
		"value": "confidential_issues",
		"description": "在机密问题事件上触发"
	},
	{
		"name": "机密评论",
		"value": "confidential_note",
		"description": "当发表机密评论时触发"
	},
	{
		"name": "部署",
		"value": "deployment",
		"description": "在部署开始/成功/失败/取消时触发"
	},
	{
		"name": "问题",
		"value": "issues",
		"description": "当创建新问题或更新/关闭/重新打开现有问题时触发"
	},
	{
		"name": "作业",
		"value": "job",
		"description": "在作业状态更改时触发"
	},
	{
		"name": "合并请求",
		"value": "merge_requests",
		"description": "在创建新的合并请求、更新/合并/关闭现有合并请求或将提交添加到源分支时触发"
	},
	{
		"name": "流水线",
		"value": "pipeline",
		"description": "在流水线状态更改时触发"
	},
	{
		"name": "推送",
		"value": "push",
		"description": "当推送到存储库时触发，除非推送标签"
	},
	{
		"name": "发布",
		"value": "releases",
		"description": "在创建或更新发布时触发"
	},
	{
		"name": "标签",
		"value": "tag_push",
		"description": "当创建（或删除）标签时触发"
	},
	{
		"name": "Wiki 页面",
		"value": "wiki_page",
		"description": "在创建、更新或删除 Wiki 页面时触发"
	}

];

export class GitlabTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'GitLab Trigger',
		name: 'gitlabTrigger',
		icon: 'file:gitlab.svg',
		group: ['trigger'],
		version: 1,
		subtitle:
			'={{$parameter["owner"] + "/" + $parameter["repository"] + ": " + $parameter["events"].join(", ")}}',
		description: '当 GitLab 事件发生时启动工作流程',
		defaults: {
			name: 'GitLab Trigger',
		},
		inputs: [],
		outputs: ['main'],
		credentials: [
			{
				name: 'gitlabApi',
				required: true,
				displayOptions: {
					show: {
						authentication: ['accessToken'],
					},
				},
			},
			{
				name: 'gitlabOAuth2Api',
				required: true,
				displayOptions: {
					show: {
						authentication: ['oAuth2'],
					},
				},
			},
		],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'webhook',
			},
		],
		properties: [
			{
				"displayName": "认证",
				"name": "authentication",
				"type": "options",
				"options": [
					{
						"name": "访问令牌",
						"value": "accessToken"
					},
					{
						"name": "OAuth2",
						"value": "oAuth2"
					}
				],
				"default": "accessToken"
			},
			{
				"displayName": "仓库所有者",
				"name": "owner",
				"type": "string",
				"default": "",
				"required": true,
				"placeholder": "n8n-io",
				"description": "仓库所有者"
			},
			{
				"displayName": "仓库名称",
				"name": "repository",
				"type": "string",
				"default": "",
				"required": true,
				"placeholder": "n8n",
				"description": "仓库名称"
			},
			{
				displayName: '事件',
				name: 'events',
				type: 'multiOptions',
				options: [
					...GITLAB_EVENTS,
					{
						name: '*',
						value: '*',
						description: '任何时间触发任何事件（通配符事件）',
					},
				],
				required: true,
				default: [],
				description: '要监听的事件',
			},
		],
	};

	webhookMethods = {
		default: {
			async checkExists(this: IHookFunctions): Promise<boolean> {
				const webhookData = this.getWorkflowStaticData('node');

				if (webhookData.webhookId === undefined) {
					// No webhook id is set so no webhook can exist
					return false;
				}

				// Webhook got created before so check if it still exists
				const owner = this.getNodeParameter('owner') as string;
				const repository = this.getNodeParameter('repository') as string;

				const path = `${owner}/${repository}`.replace(/\//g, '%2F');

				const endpoint = `/projects/${path}/hooks/${webhookData.webhookId}`;

				try {
					await gitlabApiRequest.call(this, 'GET', endpoint, {});
				} catch (error) {
					if (error.cause.httpCode === '404' || error.description.includes('404')) {
						// Webhook does not exist
						delete webhookData.webhookId;
						delete webhookData.webhookEvents;

						return false;
					}

					// Some error occured
					throw error;
				}

				// If it did not error then the webhook exists
				return true;
			},
			/**
			 * Gitlab API - Add project hook:
			 * 	https://docs.gitlab.com/ee/api/projects.html#add-project-hook
			 */
			async create(this: IHookFunctions): Promise<boolean> {
				const webhookUrl = this.getNodeWebhookUrl('default');

				const owner = this.getNodeParameter('owner') as string;
				const repository = this.getNodeParameter('repository') as string;

				let eventsArray = this.getNodeParameter('events', []) as string[];
				if (eventsArray.includes('*')) {
					eventsArray = GITLAB_EVENTS.map((e) => e.value);
				}

				const events: { [key: string]: boolean } = {};
				for (const e of eventsArray) {
					events[`${e}_events`] = true;
				}

				// gitlab set the push_events to true when the field it's not sent.
				// set it to false when it's not picked by the user.
				if (events.push_events === undefined) {
					events.push_events = false;
				}

				const path = `${owner}/${repository}`.replace(/\//g, '%2F');

				const endpoint = `/projects/${path}/hooks`;

				const body = {
					url: webhookUrl,
					...events,
					enable_ssl_verification: false,
				};

				let responseData;
				try {
					responseData = await gitlabApiRequest.call(this, 'POST', endpoint, body);
				} catch (error) {
					throw new NodeApiError(this.getNode(), error as JsonObject);
				}

				if (responseData.id === undefined) {
					// Required data is missing so was not successful
					throw new NodeApiError(this.getNode(), responseData as JsonObject, {
						message: 'GitLab webhook creation response did not contain the expected data.',
					});
				}

				const webhookData = this.getWorkflowStaticData('node');
				webhookData.webhookId = responseData.id as string;
				webhookData.webhookEvents = eventsArray;

				return true;
			},
			async delete(this: IHookFunctions): Promise<boolean> {
				const webhookData = this.getWorkflowStaticData('node');

				if (webhookData.webhookId !== undefined) {
					const owner = this.getNodeParameter('owner') as string;
					const repository = this.getNodeParameter('repository') as string;

					const path = `${owner}/${repository}`.replace(/\//g, '%2F');

					const endpoint = `/projects/${path}/hooks/${webhookData.webhookId}`;
					const body = {};

					try {
						await gitlabApiRequest.call(this, 'DELETE', endpoint, body);
					} catch (error) {
						return false;
					}

					// Remove from the static workflow data so that it is clear
					// that no webhooks are registered anymore
					delete webhookData.webhookId;
					delete webhookData.webhookEvents;
				}

				return true;
			},
		},
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const bodyData = this.getBodyData();

		const returnData: IDataObject[] = [];

		returnData.push({
			body: bodyData,
			headers: this.getHeaderData(),
			query: this.getQueryData(),
		});

		return {
			workflowData: [this.helpers.returnJsonArray(returnData)],
		};
	}
}
