import type {
	IHookFunctions,
	IWebhookFunctions,
	IDataObject,
	INodeType,
	INodeTypeDescription,
	IWebhookResponseData,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError, NodeOperationError } from 'n8n-workflow';

import { githubApiRequest } from './GenericFunctions';
import { getRepositories, getUsers } from './SearchFunctions';

export class GithubTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Github Trigger',
		name: 'githubTrigger',
		icon: 'file:github.svg',
		group: ['trigger'],
		version: 1,
		subtitle:
			'={{$parameter["owner"] + "/" + $parameter["repository"] + ": " + $parameter["events"].join(", ")}}',
		description: '在 Github 事件发生时启动工作流',
		defaults: {
			name: 'Github Trigger',
		},
		inputs: [],
		outputs: ['main'],
		credentials: [
			{
				name: 'githubApi',
				required: true,
				displayOptions: {
					show: {
						authentication: ['accessToken'],
					},
				},
			},
			{
				name: 'githubOAuth2Api',
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
				"displayName": "只有拥有组织的所有者权限或存储库的管理员权限才能设置此节点所需的 Webhooks。",
				"name": "notice",
				"type": "notice",
				"default": ""
			},
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
				"type": "resourceLocator",
				"default": {
					"mode": "list",
					"value": ""
				},
				"required": true,
				"modes": [
					{
						"displayName": "存储库所有者",
						"name": "list",
						"type": "list",
						"placeholder": "选择所有者...",
						"typeOptions": {
							"searchListMethod": "getUsers",
							"searchable": true,
							"searchFilterRequired": true
						}
					},
					{
						"displayName": "链接",
						"name": "url",
						"type": "string",
						"placeholder": "例如 https://github.com/n8n-io",
						"extractValue": {
							"type": "regex",
							"regex": "https:\\/\\/github.com\\/([-_0-9a-zA-Z]+)"
						},
						"validation": [
							{
								"type": "regex",
								"properties": {
									"regex": "https:\\/\\/github.com\\/([-_0-9a-zA-Z]+)(?:.*)",
									"errorMessage": "不是有效的 Github URL"
								}
							}
						]
					},
					{
						"displayName": "按名称",
						"name": "name",
						"type": "string",
						"placeholder": "例如 n8n-io",
						"validation": [
							{
								"type": "regex",
								"properties": {
									"regex": "[-_a-zA-Z0-9]+",
									"errorMessage": "不是有效的 Github 所有者名称"
								}
							}
						],
						"url": "=https://github.com/{{$value}}"
					}
				]
			},
			{
				"displayName": "仓库名称",
				"name": "repository",
				"type": "resourceLocator",
				"default": {
					"mode": "list",
					"value": ""
				},
				"required": true,
				"modes": [
					{
						"displayName": "Repository Name",
						"name": "list",
						"type": "list",
						"placeholder": "选择一个存储库...",
						"typeOptions": {
							"searchListMethod": "getRepositories",
							"searchable": true
						}
					},
					{
						"displayName": "链接",
						"name": "url",
						"type": "string",
						"placeholder": "例如 https://github.com/n8n-io/n8n",
						"extractValue": {
							"type": "regex",
							"regex": "https:\\/\\/github.com\\/(?:[-_0-9a-zA-Z]+)\\/([-_.0-9a-zA-Z]+)"
						},
						"validation": [
							{
								"type": "regex",
								"properties": {
									"regex": "https:\\/\\/github.com\\/(?:[-_0-9a-zA-Z]+)\\/([-_.0-9a-zA-Z]+)(?:.*)",
									"errorMessage": "不是有效的 Github 存储库 URL"
								}
							}
						]
					},
					{
						"displayName": "按名称",
						"name": "name",
						"type": "string",
						"placeholder": "例如 n8n",
						"validation": [
							{
								"type": "regex",
								"properties": {
									"regex": "[-_.0-9a-zA-Z]+",
									"errorMessage": "不是有效的 Github 存储库名称"
								}
							}
						],
						url: '=https://github.com/{{$parameter["owner"]}}/{{$value}}',
					}
				]
			},
			{
				displayName: '事件',
				name: 'events',
				type: 'multiOptions',
				options: [
					{
						"name": "*",
						"value": "*",
						"description": "任何时候触发的事件（通配符事件）"
					},
					{
						"name": "Check Run",
						"value": "check_run",
						"description": "当创建、重新请求、完成检查运行或有请求的动作时触发"
					},
					{
						"name": "Check Suite",
						"value": "check_suite",
						"description": "当检查套件完成、请求或重新请求时触发"
					},
					{
						"name": "Commit Comment",
						"value": "commit_comment",
						"description": "当创建提交评论时触发"
					},
					{
						"name": "Create",
						"value": "create",
						"description": "表示创建的存储库、分支或标签"
					},
					{
						"name": "Delete",
						"value": "delete",
						"description": "表示删除的分支或标签"
					},
					{
						"name": "Deploy Key",
						"value": "deploy_key",
						"description": "当将部署密钥添加或从存储库中删除时触发"
					},
					{
						"name": "Deployment",
						"value": "deployment",
						"description": "表示部署"
					},
					{
						"name": "Deployment Status",
						"value": "deployment_status",
						"description": "表示部署状态"
					},
					{
						"name": "Fork",
						"value": "fork",
						"description": "当用户复制存储库时触发"
					},
					{
						"name": "Github App Authorization",
						"value": "github_app_authorization",
						"description": "当某人撤销对GitHub应用程序的授权时触发"
					},
					{
						"name": "Gollum",
						"value": "gollum",
						"description": "当创建或更新Wiki页面时触发"
					},
					{
						"name": "Installation",
						"value": "installation",
						"description": "当某人安装（创建）、卸载（删除）GitHub应用程序，或接受GitHub应用程序的新权限（新权限被接受）时触发。当GitHub应用程序所有者请求新权限时，安装GitHub应用程序的人必须接受新权限请求"
					},
					{
						"name": "Installation Repositories",
						"value": "installation_repositories",
						"description": "当将存储库添加或从安装中删除时触发"
					},
					{
						"name": "Issue Comment",
						"value": "issue_comment",
						"description": "当创建、编辑或删除问题评论时触发"
					},
					{
						"name": "Issues",
						"value": "issues",
						"description": "当打开、编辑、删除、转移、固定、取消固定、关闭、重新打开、分配、取消分配、标记、取消标记、锁定、解锁、设置里程碑或取消里程碑时触发问题"
					},
					{
						"name": "Label",
						"value": "label",
						"description": "当创建、编辑或删除存储库的标签时触发"
					},
					{
						"name": "Marketplace Purchase",
						"value": "marketplace_purchase",
						"description": "当某人购买GitHub市场计划、取消计划、升级计划（立即生效）、降级计划（保持挂起直到计费周期结束）、或取消挂起计划更改时触发"
					},
					{
						"name": "Member",
						"value": "member",
						"description": "当用户接受邀请或从协作者列表中移除、或其权限发生变化时触发"
					},
					{
						"name": "Membership",
						"value": "membership",
						"description": "当用户被添加或从团队中移除时触发。仅适用于组织挂钩"
					},
					{
						"name": "Meta",
						"value": "meta",
						"description": "当删除此事件配置的Webhook时触发"
					},
					{
						"name": "Milestone",
						"value": "milestone",
						"description": "当创建、关闭、打开、编辑或删除里程碑时触发"
					},
					{
						"name": "Org Block",
						"value": "org_block",
						"description": "当组织阻止或解除阻止用户时触发。仅适用于组织挂钩"
					},
					{
						"name": "Organization",
						"value": "organization",
						"description": "当组织被删除和重命名、用户被添加、移除或邀请到组织时触发。仅适用于组织挂钩"
					},
					{
						"name": "Page Build",
						"value": "page_build",
						"description": "当推送到启用GitHub Pages的分支时触发（项目页面的gh-pages，用户和组织页面的master）"
					},
					{
						"name": "Project",
						"value": "project",
						"description": "当创建、更新、关闭、重新打开或删除项目时触发"
					},
					{
						"name": "Project Card",
						"value": "project_card",
						"description": "当创建、编辑、移动、转换为问题或删除项目卡时触发"
					},
					{
						"name": "Project Column",
						"value": "project_column",
						"description": "当创建、更新、移动或删除项目列时触发"
					},
					{
						"name": "Public",
						"value": "public",
						"description": "当私有存储库公开时触发"
					},
					{
						"name": "Pull Request",
						"value": "pull_request",
						"description": "当分配、取消分配、标记、取消标记、打开、编辑、关闭、重新打开、同步、准备审阅、锁定、解锁、请求审阅或删除审阅请求时触发拉取请求"
					},
					{
						"name": "Pull Request Review",
						"value": "pull_request_review",
						"description": "当拉取请求审阅提交到非挂起状态、编辑正文或驳回审阅时触发"
					},
					{
						"name": "Pull Request Review Comment",
						"value": "pull_request_review_comment",
						"description": "当在拉取请求的统一差异上创建、编辑或删除评论（在“文件更改”选项卡中）时触发"
					},
					{
						"name": "Push",
						"value": "push",
						"description": "当推送到存储库分支时触发。分支推送和存储库标签推送也会触发Webhook推送事件。这是默认事件"
					},
					{
						"name": "Release",
						"value": "release",
						"description": "当发布、取消发布、创建、编辑、删除或预发布发布时触发"
					},
					{
						"name": "Repository",
						"value": "repository",
						"description": "当创建、存档、取消存档、重命名、编辑、转移、公开、或私有化存储库时触发。组织挂钩还会在删除存储库时触发"
					},
					{
						"name": "Repository Import",
						"value": "repository_import",
						"description": "当GitHub组织或个人存储库的成功、取消或失败的存储库导入完成时触发"
					},
					{
						"name": "Repository Vulnerability Alert",
						"value": "repository_vulnerability_alert",
						"description": "当创建、解除或解决安全警报时触发"
					},
					{
						"name": "Security Advisory",
						"value": "security_advisory",
						"description": "当新安全咨询发布、更新或撤回时触发"
					},
					{
						"name": "Star",
						"value": "star",
						"description": "当从存储库中添加或删除星标时触发"
					},
					{
						"name": "Status",
						"value": "status",
						"description": "当Git提交状态发生变化时触发"
					},
					{
						"name": "Team",
						"value": "team",
						"description": "当组织的团队被创建、删除、编辑、添加到存储库或从存储库中移除时触发。仅适用于组织挂钩"
					},
					{
						"name": "Team Add",
						"value": "team_add",
						"description": "当将存储库添加到团队时触发"
					},
					{
						"name": "Watch",
						"value": "watch",
						"description": "当有人为存储库加星标时触发"
					}
				],
				required: true,
				default: [],
				description: '要监听的事件',
			},
			{
				"displayName": "选项",
				"name": "options",
				"type": "collection",
				"placeholder": "添加选项",
				"default": {},
				"options": [
					{
						"displayName": "不安全的SSL",
						"name": "insecureSSL",
						"type": "boolean",
						"default": false,
						"description": "是否在传递有效载荷时由GitHub验证n8n主机的SSL证书"
					}
				]
			}
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
				const owner = this.getNodeParameter('owner', '', { extractValue: true }) as string;
				const repository = this.getNodeParameter('repository', '', {
					extractValue: true,
				}) as string;
				const endpoint = `/repos/${owner}/${repository}/hooks/${webhookData.webhookId}`;

				try {
					await githubApiRequest.call(this, 'GET', endpoint, {});
				} catch (error) {
					if (error.cause.httpCode === '404') {
						// Webhook does not exist
						delete webhookData.webhookId;
						delete webhookData.webhookEvents;

						return false;
					}

					// Some error occurred
					throw error;
				}
				// If it did not error then the webhook exists
				return true;
			},
			async create(this: IHookFunctions): Promise<boolean> {
				const webhookUrl = this.getNodeWebhookUrl('default') as string;

				if (webhookUrl.includes('//localhost')) {
					throw new NodeOperationError(
						this.getNode(),
						'The Webhook can not work on "localhost". Please, either setup n8n on a custom domain or start with "--tunnel"!',
					);
				}

				const owner = this.getNodeParameter('owner', '', { extractValue: true }) as string;
				const repository = this.getNodeParameter('repository', '', {
					extractValue: true,
				}) as string;
				const events = this.getNodeParameter('events', []);

				const endpoint = `/repos/${owner}/${repository}/hooks`;
				const options = this.getNodeParameter('options') as { insecureSSL: boolean };

				const body = {
					name: 'web',
					config: {
						url: webhookUrl,
						content_type: 'json',
						insecure_ssl: options.insecureSSL ? '1' : '0',
					},
					events,
					active: true,
				};

				const webhookData = this.getWorkflowStaticData('node');

				let responseData;
				try {
					responseData = await githubApiRequest.call(this, 'POST', endpoint, body);
				} catch (error) {
					if (error.cause.httpCode === '422') {
						// Webhook exists already

						// Get the data of the already registered webhook
						responseData = await githubApiRequest.call(this, 'GET', endpoint, body);

						for (const webhook of responseData as IDataObject[]) {
							if ((webhook.config! as IDataObject).url! === webhookUrl) {
								// Webhook got found
								if (JSON.stringify(webhook.events) === JSON.stringify(events)) {
									// Webhook with same events exists already so no need to
									// create it again simply save the webhook-id
									webhookData.webhookId = webhook.id as string;
									webhookData.webhookEvents = webhook.events as string[];
									return true;
								}
							}
						}

						throw new NodeOperationError(
							this.getNode(),
							'A webhook with the identical URL probably exists already. Please delete it manually on Github!',
							{ level: 'warning' },
						);
					}

					if (error.cause.httpCode === '404') {
						throw new NodeOperationError(
							this.getNode(),
							'Check that the repository exists and that you have permission to create the webhooks this node requires',
							{ level: 'warning' },
						);
					}

					throw error;
				}

				if (responseData.id === undefined || responseData.active !== true) {
					// Required data is missing so was not successful
					throw new NodeApiError(this.getNode(), responseData as JsonObject, {
						message: 'Github webhook creation response did not contain the expected data.',
					});
				}

				webhookData.webhookId = responseData.id as string;
				webhookData.webhookEvents = responseData.events as string[];

				return true;
			},
			async delete(this: IHookFunctions): Promise<boolean> {
				const webhookData = this.getWorkflowStaticData('node');

				if (webhookData.webhookId !== undefined) {
					const owner = this.getNodeParameter('owner', '', { extractValue: true }) as string;
					const repository = this.getNodeParameter('repository', '', {
						extractValue: true,
					}) as string;
					const endpoint = `/repos/${owner}/${repository}/hooks/${webhookData.webhookId}`;
					const body = {};

					try {
						await githubApiRequest.call(this, 'DELETE', endpoint, body);
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

	methods = {
		listSearch: {
			getUsers,
			getRepositories,
		},
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const bodyData = this.getBodyData();

		// Check if the webhook is only the ping from Github to confirm if it workshook_id
		if (bodyData.hook_id !== undefined && bodyData.action === undefined) {
			// Is only the ping and not an actual webhook call. So return 'OK'
			// but do not start the workflow.

			return {
				webhookResponse: 'OK',
			};
		}

		// Is a regular webhook call

		// TODO: Add headers & requestPath
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
