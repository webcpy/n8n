import { access, mkdir } from 'fs/promises';
import { URL } from 'url';
import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';

import type { LogOptions, SimpleGit, SimpleGitOptions } from 'simple-git';
import simpleGit from 'simple-git';
import {
	addConfigFields,
	addFields,
	cloneFields,
	commitFields,
	logFields,
	pushFields,
	tagFields,
} from './descriptions';

export class Git implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Git',
		name: 'git',
		icon: 'file:git.svg',
		group: ['transform'],
		version: 1,
		description: '管理 git.',
		defaults: {
			name: 'Git',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'gitPassword',
				required: true,
				displayOptions: {
					show: {
						authentication: ['gitPassword'],
					},
				},
			},
		],
		properties: [
			{
				"displayName": "身份认证",
				"name": "authentication",
				"type": "options",
				"options": [
					{
						"name": "身份验证",
						"value": "gitPassword"
					},
					{
						"name": "None",
						"value": "none"
					}
				],
				"displayOptions": {
					"show": {
						"operation": ["clone", "push"]
					}
				},
				"default": "none",
				"description": "认证方式"
			},
			{
				"displayName": "运行",
				"name": "operation",
				"type": "options",
				"noDataExpression": true,
				"default": "log",
				"options": [
					{
						"name": "Add",
						"value": "add",
						"description": "添加文件或文件夹进行提交",
						"action": "添加文件或文件夹进行提交"
					},
					{
						"name": "Add Config",
						"value": "addConfig",
						"description": "添加配置属性",
						"action": "添加配置属性"
					},
					{
						"name": "Clone",
						"value": "clone",
						"description": "克隆存储库",
						"action": "克隆存储库"
					},
					{
						"name": "Commit",
						"value": "commit",
						"description": "提交文件或文件夹到 git",
						"action": "提交文件或文件夹到 git"
					},
					{
						"name": "Fetch",
						"value": "fetch",
						"description": "从远程存储库获取",
						"action": "从远程存储库获取"
					},
					{
						"name": "List Config",
						"value": "listConfig",
						"description": "返回当前配置",
						"action": "返回当前配置"
					},
					{
						"name": "Log",
						"value": "log",
						"description": "返回 git 提交历史",
						"action": "返回 git 提交历史"
					},
					{
						"name": "Pull",
						"value": "pull",
						"description": "从远程存储库拉取",
						"action": "从远程存储库拉取"
					},
					{
						"name": "Push",
						"value": "push",
						"description": "推送到远程存储库",
						"action": "推送到远程存储库"
					},
					{
						"name": "Push Tags",
						"value": "pushTags",
						"description": "推送标签到远程存储库",
						"action": "推送标签到远程存储库"
					},
					{
						"name": "Status",
						"value": "status",
						"description": "返回当前存储库的状态",
						"action": "返回当前存储库的状态"
					},
					{
						"name": "Tag",
						"value": "tag",
						"description": "创建新标签",
						"action": "创建新标签"
					},
					{
						"name": "User Setup",
						"value": "userSetup",
						"description": "设置用户",
						"action": "设置用户"
					}
				]
			},
			{
				"displayName": "存储库路径",
				"name": "repositoryPath",
				"type": "string",
				"displayOptions": {
					"hide": {
						"operation": ["clone"]
					}
				},
				"default": "",
				"placeholder": "/tmp/repository",
				"required": true,
				"description": "要操作的 git 存储库的本地路径"
			},
			{
				"displayName": "新存储库路径",
				"name": "repositoryPath",
				"type": "string",
				"displayOptions": {
					"show": {
						"operation": ["clone"]
					}
				},
				"default": "",
				"placeholder": "/tmp/repository",
				"required": true,
				"description": "将 git 存储库克隆到的本地路径"
			},


			...addFields,
			...addConfigFields,
			...cloneFields,
			...commitFields,
			...logFields,
			...pushFields,
			...tagFields,
			// ...userSetupFields,
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();

		const prepareRepository = async (repositoryPath: string): Promise<string> => {
			const authentication = this.getNodeParameter('authentication', 0) as string;

			if (authentication === 'gitPassword') {
				const gitCredentials = await this.getCredentials('gitPassword');

				const url = new URL(repositoryPath);
				url.username = gitCredentials.username as string;
				url.password = gitCredentials.password as string;

				return url.toString();
			}

			return repositoryPath;
		};

		const operation = this.getNodeParameter('operation', 0);
		const returnItems: INodeExecutionData[] = [];
		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				const repositoryPath = this.getNodeParameter('repositoryPath', itemIndex, '') as string;
				const options = this.getNodeParameter('options', itemIndex, {});

				if (operation === 'clone') {
					// Create repository folder if it does not exist
					try {
						await access(repositoryPath);
					} catch (error) {
						await mkdir(repositoryPath);
					}
				}

				const gitOptions: Partial<SimpleGitOptions> = {
					baseDir: repositoryPath,
				};

				const git: SimpleGit = simpleGit(gitOptions)
					// Tell git not to ask for any information via the terminal like for
					// example the username. As nobody will be able to answer it would
					// n8n keep on waiting forever.
					.env('GIT_TERMINAL_PROMPT', '0');

				if (operation === 'add') {
					// ----------------------------------
					//         add
					// ----------------------------------

					const pathsToAdd = this.getNodeParameter('pathsToAdd', itemIndex, '') as string;

					await git.add(pathsToAdd.split(','));

					returnItems.push({
						json: {
							success: true,
						},
						pairedItem: {
							item: itemIndex,
						},
					});
				} else if (operation === 'addConfig') {
					// ----------------------------------
					//         addConfig
					// ----------------------------------

					const key = this.getNodeParameter('key', itemIndex, '') as string;
					const value = this.getNodeParameter('value', itemIndex, '') as string;
					let append = false;

					if (options.mode === 'append') {
						append = true;
					}

					await git.addConfig(key, value, append);
					returnItems.push({
						json: {
							success: true,
						},
						pairedItem: {
							item: itemIndex,
						},
					});
				} else if (operation === 'clone') {
					// ----------------------------------
					//         clone
					// ----------------------------------

					let sourceRepository = this.getNodeParameter('sourceRepository', itemIndex, '') as string;
					sourceRepository = await prepareRepository(sourceRepository);

					await git.clone(sourceRepository, '.');

					returnItems.push({
						json: {
							success: true,
						},
						pairedItem: {
							item: itemIndex,
						},
					});
				} else if (operation === 'commit') {
					// ----------------------------------
					//         commit
					// ----------------------------------

					const message = this.getNodeParameter('message', itemIndex, '') as string;

					let pathsToAdd: string[] | undefined = undefined;
					if (options.files !== undefined) {
						pathsToAdd = (options.pathsToAdd as string).split(',');
					}

					await git.commit(message, pathsToAdd);

					returnItems.push({
						json: {
							success: true,
						},
						pairedItem: {
							item: itemIndex,
						},
					});
				} else if (operation === 'fetch') {
					// ----------------------------------
					//         fetch
					// ----------------------------------

					await git.fetch();
					returnItems.push({
						json: {
							success: true,
						},
						pairedItem: {
							item: itemIndex,
						},
					});
				} else if (operation === 'log') {
					// ----------------------------------
					//         log
					// ----------------------------------

					const logOptions: LogOptions = {};

					const returnAll = this.getNodeParameter('returnAll', itemIndex, false);
					if (!returnAll) {
						logOptions.maxCount = this.getNodeParameter('limit', itemIndex, 100);
					}
					if (options.file) {
						logOptions.file = options.file as string;
					}

					const log = await git.log(logOptions);

					returnItems.push(
						// @ts-ignore
						...this.helpers.returnJsonArray(log.all).map((item) => {
							return {
								...item,
								pairedItem: { item: itemIndex },
							};
						}),
					);
				} else if (operation === 'pull') {
					// ----------------------------------
					//         pull
					// ----------------------------------

					await git.pull();
					returnItems.push({
						json: {
							success: true,
						},
						pairedItem: {
							item: itemIndex,
						},
					});
				} else if (operation === 'push') {
					// ----------------------------------
					//         push
					// ----------------------------------

					if (options.repository) {
						const targetRepository = await prepareRepository(options.targetRepository as string);
						await git.push(targetRepository);
					} else {
						const authentication = this.getNodeParameter('authentication', 0) as string;
						if (authentication === 'gitPassword') {
							// Try to get remote repository path from git repository itself to add
							// authentication data
							const config = await git.listConfig();
							let targetRepository;
							for (const fileName of Object.keys(config.values)) {
								if (config.values[fileName]['remote.origin.url']) {
									targetRepository = config.values[fileName]['remote.origin.url'];
									break;
								}
							}

							targetRepository = await prepareRepository(targetRepository as string);
							await git.push(targetRepository);
						} else {
							await git.push();
						}
					}

					returnItems.push({
						json: {
							success: true,
						},
						pairedItem: {
							item: itemIndex,
						},
					});
				} else if (operation === 'pushTags') {
					// ----------------------------------
					//         pushTags
					// ----------------------------------

					await git.pushTags();
					returnItems.push({
						json: {
							success: true,
						},
						pairedItem: {
							item: itemIndex,
						},
					});
				} else if (operation === 'listConfig') {
					// ----------------------------------
					//         listConfig
					// ----------------------------------

					const config = await git.listConfig();

					const data = [];
					for (const fileName of Object.keys(config.values)) {
						data.push({
							_file: fileName,
							...config.values[fileName],
						});
					}

					// @ts-ignore
					returnItems.push(
						...this.helpers.returnJsonArray(data).map((item) => {
							return {
								...item,
								pairedItem: { item: itemIndex },
							};
						}),
					);
				} else if (operation === 'status') {
					// ----------------------------------
					//         status
					// ----------------------------------

					const status = await git.status();

					returnItems.push(
						// @ts-ignore
						...this.helpers.returnJsonArray([status]).map((item) => {
							return {
								...item,
								pairedItem: { item: itemIndex },
							};
						}),
					);
				} else if (operation === 'tag') {
					// ----------------------------------
					//         tag
					// ----------------------------------

					const name = this.getNodeParameter('name', itemIndex, '') as string;

					await git.addTag(name);
					returnItems.push({
						json: {
							success: true,
						},
						pairedItem: {
							item: itemIndex,
						},
					});
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnItems.push({
						json: {
							error: error.toString(),
						},
						pairedItem: {
							item: itemIndex,
						},
					});
					continue;
				}

				throw error;
			}
		}

		return [returnItems];
	}
}
