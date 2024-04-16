import type {
	ITriggerFunctions,
	IDataObject,
	INodeType,
	INodeTypeDescription,
	ITriggerResponse,
} from 'n8n-workflow';

import { watch } from 'chokidar';

export class LocalFileTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Local File Trigger',
		name: 'localFileTrigger',
		icon: 'fa:folder-open',
		group: ['trigger'],
		version: 1,
		subtitle: '=Path: {{$parameter["path"]}}',
		description: '在文件系统更改时触发一个工作流程',
		eventTriggerDescription: '',
		defaults: {
			name: 'Local File Trigger',
			color: '#404040',
		},
		triggerPanel: {
			"header": "",
			"executionsHelp": {
				"inactive":
					"<b>在构建工作流程时</b>，点击“监听”按钮，然后对所监视的文件或文件夹进行更改。这将触发一个执行，该执行将显示在此编辑器中。<br /> <br /><b>一旦您对工作流程满意</b>，<a data-key='activate'>激活</a>它。然后每次检测到变化时，工作流程将执行。这些执行将显示在<a data-key='executions'>执行列表</a>中，但不会显示在编辑器中。",
				"active":
					"<b>在构建工作流程时</b>，点击“监听”按钮，然后对所监视的文件或文件夹进行更改。这将触发一个执行，该执行将显示在此编辑器中。<br /> <br /><b>由于它已激活，因此您的工作流程也将自动执行</b>。每次检测到变化时，此节点将触发一个执行。这些执行将显示在<a data-key='executions'>执行列表</a>中，但不会显示在编辑器中。"
			},
			"activationHint":
				"一旦您完成构建工作流程，请<a data-key='activate'>激活</a>它以使其持续监听（您只是看不到这些执行）。"
		},

		inputs: [],
		outputs: ['main'],
		properties: [
			{
				"displayName": "触发器",
				"name": "triggerOn",
				"type": "options",
				"options": [
					{
						"name": "特定文件的更改",
						"value": "file"
					},
					{
						"name": "特定文件夹的更改",
						"value": "folder"
					}
				],
				"required": true,
				"default": ""
			},
			{
				"displayName": "要监视的文件",
				"name": "path",
				"type": "string",
				"displayOptions": {
					"show": {
						"triggerOn": ["file"]
					}
				},
				"default": "",
				"placeholder": "/data/invoices/1.pdf"
			},
			{
				"displayName": "要监视的文件夹",
				"name": "path",
				"type": "string",
				"displayOptions": {
					"show": {
						"triggerOn": ["folder"]
					}
				},
				"default": "",
				"placeholder": "/data/invoices"
			},
			{
				"displayName": "监听事件",
				"name": "events",
				"type": "multiOptions",
				"displayOptions": {
					"show": {
						"triggerOn": ["folder"]
					}
				},
				"options": [
					{
						"name": "文件添加",
						"value": "add",
						"description": "每当添加新文件时触发"
					},
					{
						"name": "文件更改",
						"value": "change",
						"description": "每当文件更改时触发"
					},
					{
						"name": "文件删除",
						"value": "unlink",
						"description": "每当删除文件时触发"
					},
					{
						"name": "文件夹添加",
						"value": "addDir",
						"description": "每当添加新文件夹时触发"
					},
					{
						"name": "文件夹删除",
						"value": "unlinkDir",
						"description": "每当删除文件夹时触发"
					}
				],
				"required": true,
				"default": [],
				"description": "要监听的事件"
			},

			{
				"displayName": "选项",
				"name": "options",
				"type": "collection",
				"placeholder": "添加选项",
				"default": {},
				"options": [
					{
						"displayName": "等待写入完成",
						"name": "awaitWriteFinish",
						"type": "boolean",
						"default": false,
						"description": "是否等待文件写入完成，以避免部分读取"
					},
					{
						"displayName": "包括链接文件/文件夹",
						"name": "followSymlinks",
						"type": "boolean",
						"default": true,
						"description": "是否也监听链接的文件/文件夹（包括符号链接、MacOS 上的别名以及 Windows 上的快捷方式）。否则仅监视链接本身。"
					},
					{
						"displayName": "忽略",
						"name": "ignored",
						"type": "string",
						"default": "",
						"placeholder": "**/*.txt",
						"description": "要忽略的文件或路径。将测试整个路径，而不仅仅是文件名。支持 <a href=\"https://github.com/micromatch/anymatch\">Anymatch</a> 语法。"
					},
					{
						"displayName": "忽略现有文件/文件夹",
						"name": "ignoreInitial",
						"type": "boolean",
						"default": true,
						"description": "是否忽略现有的文件/文件夹，以免触发事件"
					},
					{
						"displayName": "最大文件夹深度",
						"name": "depth",
						"type": "options",
						"options": [
							{
								"name": "向下 1 级",
								"value": 1
							},
							{
								"name": "向下 2 级",
								"value": 2
							},
							{
								"name": "向下 3 级",
								"value": 3
							},
							{
								"name": "向下 4 级",
								"value": 4
							},
							{
								"name": "向下 5 级",
								"value": 5
							},
							{
								"name": "仅顶层文件夹",
								"value": 0
							},
							{
								"name": "不限制",
								"value": -1
							}
						],
						"default": -1,
						"description": "监视文件夹结构中的深度"
					},
					{
						"displayName": "使用轮询",
						"name": "usePolling",
						"type": "boolean",
						"default": false,
						"description": "是否使用轮询进行监视。通常需要成功地在网络上监视文件。"
					}
				]
			}
		],
	};

	async trigger(this: ITriggerFunctions): Promise<ITriggerResponse> {
		const triggerOn = this.getNodeParameter('triggerOn') as string;
		const path = this.getNodeParameter('path') as string;
		const options = this.getNodeParameter('options', {}) as IDataObject;

		let events: string[];
		if (triggerOn === 'file') {
			events = ['change'];
		} else {
			events = this.getNodeParameter('events', []) as string[];
		}

		const watcher = watch(path, {
			ignored: options.ignored === '' ? undefined : options.ignored,
			persistent: true,
			ignoreInitial:
				options.ignoreInitial === undefined ? true : (options.ignoreInitial as boolean),
			followSymlinks:
				options.followSymlinks === undefined ? true : (options.followSymlinks as boolean),
			depth: [-1, undefined].includes(options.depth as number)
				? undefined
				: (options.depth as number),
			usePolling: options.usePolling as boolean,
			awaitWriteFinish: options.awaitWriteFinish as boolean,
		});

		const executeTrigger = (event: string, pathString: string) => {
			this.emit([this.helpers.returnJsonArray([{ event, path: pathString }])]);
		};

		for (const eventName of events) {
			watcher.on(eventName, (pathString) => executeTrigger(eventName, pathString as string));
		}

		async function closeFunction() {
			return await watcher.close();
		}

		return {
			closeFunction,
		};
	}
}
