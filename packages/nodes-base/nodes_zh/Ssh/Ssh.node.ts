import { rm, writeFile } from 'fs/promises';
import type { Readable } from 'stream';
import type {
	ICredentialTestFunctions,
	ICredentialsDecrypted,
	IDataObject,
	IExecuteFunctions,
	INodeCredentialTestResult,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { BINARY_ENCODING, NodeOperationError } from 'n8n-workflow';

import { file as tmpFile } from 'tmp-promise';

import type { Config } from 'node-ssh';
import { NodeSSH } from 'node-ssh';
import { formatPrivateKey } from '@utils/utilities';

async function resolveHomeDir(
	this: IExecuteFunctions,
	path: string,
	ssh: NodeSSH,
	itemIndex: number,
) {
	if (path.startsWith('~/')) {
		let homeDir = (await ssh.execCommand('echo $HOME')).stdout;

		if (homeDir.charAt(homeDir.length - 1) !== '/') {
			homeDir += '/';
		}

		return path.replace('~/', homeDir);
	}

	if (path.startsWith('~')) {
		throw new NodeOperationError(
			this.getNode(),
			'Invalid path. Replace "~" with home directory or "~/"',
			{
				itemIndex,
			},
		);
	}

	return path;
}

export class Ssh implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'SSH',
		name: 'ssh',
		icon: 'fa:terminal',
		group: ['input'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: '通过 SSH 执行命令',
		defaults: {
			name: 'SSH',
			color: '#000000',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'sshPassword',
				required: true,
				testedBy: 'sshConnectionTest',
				displayOptions: {
					show: {
						authentication: ['password'],
					},
				},
			},
			{
				name: 'sshPrivateKey',
				required: true,
				testedBy: 'sshConnectionTest',
				displayOptions: {
					show: {
						authentication: ['privateKey'],
					},
				},
			},
		],
		properties: [
			{
				"displayName": "认证",
				"name": "authentication",
				"type": "options",
				"options": [
					{
						"name": "密码",
						"value": "password"
					},
					{
						"name": "私钥",
						"value": "privateKey"
					}
				],
				"default": "password"
			},
			{
				"displayName": "Resource",
				"name": "resource",
				"type": "options",
				"noDataExpression": true,
				"options": [
					{
						"name": "命令",
						"value": "command"
					},
					{
						"name": "文件",
						"value": "file"
					}
				],
				"default": "command"
			},
			{
				"displayName": "操作",
				"name": "operation",
				"type": "options",
				"noDataExpression": true,
				"displayOptions": {
					"show": {
						"resource": [
							"command"
						]
					}
				},
				"options": [
					{
						"name": "执行",
						"value": "execute",
						"description": "执行一个命令",
						"action": "执行一个命令"
					}
				],
				"default": "execute"
			},
			{
				"displayName": "命令",
				"name": "command",
				"type": "string",
				"displayOptions": {
					"show": {
						"resource": [
							"command"
						],
						"operation": [
							"execute"
						]
					}
				},
				"default": "",
				"description": "要在远程设备上执行的命令"
			},

			{
				"displayName": "工作目录",
				"name": "cwd",
				"type": "string",
				"displayOptions": {
					"show": {
						"resource": [
							"command"
						],
						"operation": [
							"execute"
						]
					}
				},
				"default": "/",
				"required": true
			},
			{
				"displayName": "操作",
				"name": "operation",
				"type": "options",
				"noDataExpression": true,
				"displayOptions": {
					"show": {
						"resource": [
							"file"
						]
					}
				},
				"options": [
					{
						"name": "下载",
						"value": "download",
						"description": "下载文件",
						"action": "下载文件"
					},
					{
						"name": "上传",
						"value": "upload",
						"description": "上传文件",
						"action": "上传文件"
					}
				],
				"default": "upload"
			},
			{
				"displayName": "输入二进制字段",
				"name": "binaryPropertyName",
				"type": "string",
				"default": "data",
				"required": true,
				"displayOptions": {
					"show": {
						"operation": [
							"upload"
						],
						"resource": [
							"file"
						]
					}
				},
				"placeholder": "",
				"hint": "包含要上传的文件的输入二进制字段的名称"
			},
			{
				"displayName": "目标目录",
				"name": "path",
				"type": "string",
				"displayOptions": {
					"show": {
						"resource": [
							"file"
						],
						"operation": [
							"upload"
						]
					}
				},
				"default": "",
				"required": true,
				"placeholder": "/home/user",
				"description": "要将文件上传到的目录。不需要指定文件名，它将从二进制数据文件名中获取。要覆盖此行为，请在选项下设置参数“文件名”。"
			},
			{
				"displayName": "路径",
				"displayOptions": {
					"show": {
						"resource": [
							"file"
						],
						"operation": [
							"download"
						]
					}
				},
				"name": "path",
				"type": "string",
				"default": "",
				"placeholder": "/home/user/invoice.txt",
				"description": "要下载的文件的文件路径。必须包含完整的路径，包括文件名。",
				"required": true
			},


			{
				"displayName": "文件属性",
				"displayOptions": {
					"show": {
						"resource": [
							"file"
						],
						"operation": [
							"download"
						]
					}
				},
				"name": "binaryPropertyName",
				"type": "string",
				"default": "data",
				"description": "保存二进制数据的对象属性名称",
				"required": true
			},
			{
				"displayName": "选项",
				"name": "options",
				"type": "collection",
				"placeholder": "添加选项",
				"displayOptions": {
					"show": {
						"resource": [
							"file"
						],
						"operation": [
							"upload",
							"download"
						]
					}
				},
				"default": {},
				"options": [
					{
						"displayName": "文件名",
						"name": "fileName",
						"type": "string",
						"default": "",
						"description": "覆盖二进制数据文件名"
					}
				]
			}
		],
	};

	methods = {
		credentialTest: {
			async sshConnectionTest(
				this: ICredentialTestFunctions,
				credential: ICredentialsDecrypted,
			): Promise<INodeCredentialTestResult> {
				const credentials = credential.data as IDataObject;
				const ssh = new NodeSSH();
				const temporaryFiles: string[] = [];

				try {
					if (!credentials.privateKey) {
						await ssh.connect({
							host: credentials.host as string,
							username: credentials.username as string,
							port: credentials.port as number,
							password: credentials.password as string,
						});
					} else {
						const options: Config = {
							host: credentials.host as string,
							username: credentials.username as string,
							port: credentials.port as number,
							privateKey: formatPrivateKey(credentials.privateKey as string),
						};

						if (credentials.passphrase) {
							options.passphrase = credentials.passphrase as string;
						}

						await ssh.connect(options);
					}
				} catch (error) {
					const message = `SSH connection failed: ${error.message}`;
					return {
						status: 'Error',
						message,
					};
				} finally {
					ssh.dispose();
					for (const tempFile of temporaryFiles) await rm(tempFile);
				}
				return {
					status: 'OK',
					message: 'Connection successful!',
				};
			},
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();

		const returnItems: INodeExecutionData[] = [];

		const resource = this.getNodeParameter('resource', 0);
		const operation = this.getNodeParameter('operation', 0);
		const authentication = this.getNodeParameter('authentication', 0) as string;

		const temporaryFiles: string[] = [];

		const ssh = new NodeSSH();

		try {
			if (authentication === 'password') {
				const credentials = await this.getCredentials('sshPassword');

				await ssh.connect({
					host: credentials.host as string,
					username: credentials.username as string,
					port: credentials.port as number,
					password: credentials.password as string,
				});
			} else if (authentication === 'privateKey') {
				const credentials = await this.getCredentials('sshPrivateKey');
				const options: Config = {
					host: credentials.host as string,
					username: credentials.username as string,
					port: credentials.port as number,
					privateKey: formatPrivateKey(credentials.privateKey as string),
				};

				if (credentials.passphrase) {
					options.passphrase = credentials.passphrase as string;
				}

				await ssh.connect(options);
			}

			for (let i = 0; i < items.length; i++) {
				try {
					if (resource === 'command') {
						if (operation === 'execute') {
							const command = this.getNodeParameter('command', i) as string;
							const cwd = await resolveHomeDir.call(
								this,
								this.getNodeParameter('cwd', i) as string,
								ssh,
								i,
							);
							returnItems.push({
								json: (await ssh.execCommand(command, { cwd })) as unknown as IDataObject,
								pairedItem: {
									item: i,
								},
							});
						}
					}

					if (resource === 'file') {
						if (operation === 'download') {
							const dataPropertyNameDownload = this.getNodeParameter('binaryPropertyName', i);
							const parameterPath = await resolveHomeDir.call(
								this,
								this.getNodeParameter('path', i) as string,
								ssh,
								i,
							);

							const { path } = await tmpFile({ prefix: 'n8n-ssh-' });
							temporaryFiles.push(path);

							await ssh.getFile(path, parameterPath);

							const newItem: INodeExecutionData = {
								json: items[i].json,
								binary: {},
								pairedItem: {
									item: i,
								},
							};

							if (items[i].binary !== undefined && newItem.binary) {
								// Create a shallow copy of the binary data so that the old
								// data references which do not get changed still stay behind
								// but the incoming data does not get changed.
								Object.assign(newItem.binary, items[i].binary);
							}

							items[i] = newItem;

							const fileName = this.getNodeParameter('options.fileName', i, '') as string;
							items[i].binary![dataPropertyNameDownload] = await this.nodeHelpers.copyBinaryFile(
								path,
								fileName || parameterPath,
							);
						}

						if (operation === 'upload') {
							const parameterPath = await resolveHomeDir.call(
								this,
								this.getNodeParameter('path', i) as string,
								ssh,
								i,
							);
							const fileName = this.getNodeParameter('options.fileName', i, '') as string;

							const binaryPropertyName = this.getNodeParameter('binaryPropertyName', i);
							const binaryData = this.helpers.assertBinaryData(i, binaryPropertyName);

							let uploadData: Buffer | Readable;
							if (binaryData.id) {
								uploadData = await this.helpers.getBinaryStream(binaryData.id);
							} else {
								uploadData = Buffer.from(binaryData.data, BINARY_ENCODING);
							}

							const { path } = await tmpFile({ prefix: 'n8n-ssh-' });
							temporaryFiles.push(path);
							await writeFile(path, uploadData);

							await ssh.putFile(
								path,
								`${parameterPath}${parameterPath.charAt(parameterPath.length - 1) === '/' ? '' : '/'
								}${fileName || binaryData.fileName}`,
							);

							returnItems.push({
								json: {
									success: true,
								},
								pairedItem: {
									item: i,
								},
							});
						}
					}
				} catch (error) {
					if (this.continueOnFail()) {
						if (resource === 'file' && operation === 'download') {
							items[i] = {
								json: {
									error: error.message,
								},
							};
						} else {
							returnItems.push({
								json: {
									error: error.message,
								},
								pairedItem: {
									item: i,
								},
							});
						}
						continue;
					}
					throw error;
				}
			}
		} catch (error) {
			ssh.dispose();
			for (const tempFile of temporaryFiles) await rm(tempFile);
			throw error;
		}

		for (const tempFile of temporaryFiles) await rm(tempFile);

		ssh.dispose();

		if (resource === 'file' && operation === 'download') {
			// For file downloads the files get attached to the existing items
			return [items];
		} else {
			return [returnItems];
		}
	}
}
