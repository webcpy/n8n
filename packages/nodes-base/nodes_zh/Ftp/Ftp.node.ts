import { createWriteStream } from 'fs';
import { basename, dirname } from 'path';
import type { Readable } from 'stream';
import { pipeline } from 'stream/promises';
import { file as tmpFile } from 'tmp-promise';
import ftpClient from 'promise-ftp';
import sftpClient from 'ssh2-sftp-client';
import { BINARY_ENCODING, NodeApiError } from 'n8n-workflow';
import type {
	ICredentialDataDecryptedObject,
	ICredentialsDecrypted,
	ICredentialTestFunctions,
	IDataObject,
	IExecuteFunctions,
	INodeCredentialTestResult,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	JsonObject,
} from 'n8n-workflow';
import { formatPrivateKey, generatePairedItemData } from '@utils/utilities';

interface ReturnFtpItem {
	type: string;
	name: string;
	size: number;
	accessTime: Date;
	modifyTime: Date;
	rights: {
		user: string;
		group: string;
		other: string;
	};
	owner: string | number;
	group: string | number;
	target: string;
	sticky?: boolean;
	path: string;
}

async function callRecursiveList(
	path: string,
	client: sftpClient | ftpClient,
	normalizeFunction: (
		input: ftpClient.ListingElement & sftpClient.FileInfo,
		path: string,
		recursive?: boolean,
	) => void,
) {
	const pathArray: string[] = [path];
	let currentPath = path;
	const directoryItems: sftpClient.FileInfo[] = [];
	let index = 0;

	const prepareAndNormalize = (item: sftpClient.FileInfo) => {
		if (pathArray[index].endsWith('/')) {
			currentPath = `${pathArray[index]}${item.name}`;
		} else {
			currentPath = `${pathArray[index]}/${item.name}`;
		}

		// Is directory
		if (item.type === 'd') {
			// ignore . and .. to prevent infinite loop
			if (item.name === '.' || item.name === '..') {
				return;
			}
			pathArray.push(currentPath);
		}

		normalizeFunction(item as ftpClient.ListingElement & sftpClient.FileInfo, currentPath, true);
		directoryItems.push(item);
	};

	do {
		const returnData: sftpClient.FileInfo[] | Array<string | ftpClient.ListingElement> =
			await client.list(pathArray[index]);

		// @ts-ignore
		returnData.map(prepareAndNormalize);
		index++;
	} while (index <= pathArray.length - 1);

	return directoryItems;
}

async function recursivelyCreateSftpDirs(sftp: sftpClient, path: string) {
	const dirPath = dirname(path);
	const dirExists = await sftp.exists(dirPath);

	if (!dirExists) {
		await sftp.mkdir(dirPath, true);
	}
}

function normalizeSFtpItem(input: sftpClient.FileInfo, path: string, recursive = false) {
	const item = input as unknown as ReturnFtpItem;
	item.accessTime = new Date(input.accessTime);
	item.modifyTime = new Date(input.modifyTime);
	item.path = !recursive ? `${path}${path.endsWith('/') ? '' : '/'}${item.name}` : path;
}

function normalizeFtpItem(input: ftpClient.ListingElement, path: string, recursive = false) {
	const item = input as unknown as ReturnFtpItem;
	item.modifyTime = input.date;
	item.path = !recursive ? `${path}${path.endsWith('/') ? '' : '/'}${item.name}` : path;
	//@ts-ignore
	item.date = undefined;
}

export class Ftp implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'FTP',
		name: 'ftp',
		icon: 'fa:server',
		group: ['input'],
		version: 1,
		subtitle: '={{$parameter["protocol"] + ": " + $parameter["operation"]}}',
		description: '通过FTP或SFTP传输文件。',
		defaults: {
			name: 'FTP',
			color: '#303050',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				// nodelinter-ignore-next-line
				name: 'ftp',
				required: true,
				displayOptions: {
					show: {
						protocol: ['ftp'],
					},
				},
				testedBy: 'ftpConnectionTest',
			},
			{
				// nodelinter-ignore-next-line
				name: 'sftp',
				required: true,
				displayOptions: {
					show: {
						protocol: ['sftp'],
					},
				},
				testedBy: 'sftpConnectionTest',
			},
		],
		properties: [
			{
				"displayName": "协议",
				"name": "protocol",
				"type": "options",
				"options": [
					{
						"name": "FTP",
						"value": "ftp"
					},
					{
						"name": "SFTP",
						"value": "sftp"
					}
				],
				"default": "ftp",
				"description": "文件传输协议"
			},
			{
				"displayName": "操作",
				"name": "operation",
				"type": "options",
				"options": [
					{
						"name": "删除",
						"value": "delete",
						"description": "删除文件/文件夹",
						"action": "删除文件或文件夹"
					},
					{
						"name": "下载",
						"value": "download",
						"description": "下载文件",
						"action": "下载文件"
					},
					{
						"name": "列表",
						"value": "list",
						"description": "列出文件夹内容",
						"action": "列出文件夹内容"
					},
					{
						"name": "重命名",
						"value": "rename",
						"description": "重命名/移动 oldPath 到 newPath",
						"action": "重命名/移动文件或文件夹"
					},
					{
						"name": "上传",
						"value": "upload",
						"description": "上传文件",
						"action": "上传文件"
					}
				],
				"default": "download",
				"noDataExpression": true
			},


			// ----------------------------------
			//         delete
			// ----------------------------------
			{
				"displayName": "路径",
				"displayOptions": {
					"show": {
						"operation": ["delete"]
					}
				},
				"name": "path",
				"type": "string",
				"default": "",
				"description": "要删除的文件的文件路径。必须包含完整路径。",
				"placeholder": "例如：/public/documents/file-to-delete.txt",
				"required": true
			},
			{
				"displayName": "选项",
				"name": "options",
				"type": "collection",
				"placeholder": "添加选项",
				"displayOptions": {
					"show": {
						"operation": ["delete"]
					}
				},
				"default": {},
				"options": [
					{
						"displayName": "文件夹",
						"name": "folder",
						"type": "boolean",
						"default": false,
						"description": "是否可以删除文件夹"
					},
					{
						"displayName": "递归",
						"displayOptions": {
							"show": {
								"folder": [true]
							}
						},
						"name": "recursive",
						"type": "boolean",
						"default": false,
						"description": "是否删除目标目录中的所有文件和目录"
					}
				]
			},


			// ----------------------------------
			//         download
			// ----------------------------------
			{
				displayName: 'Path',
				displayOptions: {
					show: {
						operation: ['download'],
					},
				},
				name: 'path',
				type: 'string',
				default: '',
				description: 'The file path of the file to download. Has to contain the full path.',
				placeholder: 'e.g. /public/documents/file-to-download.txt',
				required: true,
			},
			{
				displayName: 'Put Output File in Field',
				displayOptions: {
					show: {
						operation: ['download'],
					},
				},
				name: 'binaryPropertyName',
				type: 'string',
				default: 'data',
				hint: 'The name of the output binary field to put the file in',
				required: true,
			},

			// ----------------------------------
			//         rename
			// ----------------------------------
			{
				"displayName": "路径",
				"displayOptions": {
					"show": {
						"operation": ["download"]
					}
				},
				"name": "path",
				"type": "string",
				"default": "",
				"description": "要下载的文件的文件路径。必须包含完整路径。",
				"placeholder": "例如：/public/documents/file-to-download.txt",
				"required": true
			},
			{
				"displayName": "将输出文件放入字段",
				"displayOptions": {
					"show": {
						"operation": ["download"]
					}
				},
				"name": "binaryPropertyName",
				"type": "string",
				"default": "data",
				"hint": "要将文件放入的输出二进制字段的名称",
				"required": true
			},


			// ----------------------------------
			//         upload
			// ----------------------------------
			{
				"displayName": "路径",
				"displayOptions": {
					"show": {
						"operation": ["upload"]
					}
				},
				"name": "path",
				"type": "string",
				"default": "",
				"description": "要上传的文件的文件路径。必须包含完整路径。",
				"placeholder": "例如：/public/documents/file-to-upload.txt",
				"required": true
			},
			{
				"displayName": "二进制文件",
				"displayOptions": {
					"show": {
						"operation": ["upload"]
					}
				},
				"name": "binaryData",
				"type": "boolean",
				"default": true,
				"description": "要上传的文件的文本内容"
			},
			{
				"displayName": "输入二进制字段",
				"displayOptions": {
					"show": {
						"operation": ["upload"],
						"binaryData": [true]
					}
				},
				"name": "binaryPropertyName",
				"type": "string",
				"default": "data",
				"hint": "包含要写入的文件的输入二进制字段的名称",
				"required": true
			},
			{
				"displayName": "文件内容",
				"displayOptions": {
					"show": {
						"operation": ["upload"],
						"binaryData": [false]
					}
				},
				"name": "fileContent",
				"type": "string",
				"default": "",
				"description": "要上传的文件的文本内容"
			},


			// ----------------------------------
			//         list
			// ----------------------------------
			{
				"displayName": "路径",
				"displayOptions": {
					"show": {
						"operation": ["list"]
					}
				},
				"name": "path",
				"type": "string",
				"default": "/",
				"placeholder": "例如：/public/folder",
				"description": "要列出内容的目录路径",
				"required": true
			},
			{
				"displayOptions": {
					"show": {
						"operation": ["list"]
					}
				},
				"displayName": "递归",
				"name": "recursive",
				"type": "boolean",
				"default": false,
				"description": "是否返回表示 SFTP 服务器中找到的所有目录/对象的对象",
				"required": true
			}

		],
	};

	methods = {
		credentialTest: {
			async ftpConnectionTest(
				this: ICredentialTestFunctions,
				credential: ICredentialsDecrypted,
			): Promise<INodeCredentialTestResult> {
				const credentials = credential.data as ICredentialDataDecryptedObject;
				const ftp = new ftpClient();
				try {
					await ftp.connect({
						host: credentials.host as string,
						port: credentials.port as number,
						user: credentials.username as string,
						password: credentials.password as string,
					});
				} catch (error) {
					await ftp.end();
					return {
						status: 'Error',
						message: error.message,
					};
				}
				await ftp.end();
				return {
					status: 'OK',
					message: 'Connection successful!',
				};
			},
			async sftpConnectionTest(
				this: ICredentialTestFunctions,
				credential: ICredentialsDecrypted,
			): Promise<INodeCredentialTestResult> {
				const credentials = credential.data as ICredentialDataDecryptedObject;
				const sftp = new sftpClient();
				try {
					if (credentials.privateKey) {
						await sftp.connect({
							host: credentials.host as string,
							port: credentials.port as number,
							username: credentials.username as string,
							password: (credentials.password as string) || undefined,
							privateKey: formatPrivateKey(credentials.privateKey as string),
							passphrase: credentials.passphrase as string | undefined,
						});
					} else {
						await sftp.connect({
							host: credentials.host as string,
							port: credentials.port as number,
							username: credentials.username as string,
							password: credentials.password as string,
						});
					}
				} catch (error) {
					await sftp.end();
					return {
						status: 'Error',
						message: error.message,
					};
				}
				await sftp.end();
				return {
					status: 'OK',
					message: 'Connection successful!',
				};
			},
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		let returnItems: INodeExecutionData[] = [];
		const operation = this.getNodeParameter('operation', 0);

		let credentials: ICredentialDataDecryptedObject | undefined = undefined;
		const protocol = this.getNodeParameter('protocol', 0) as string;

		if (protocol === 'sftp') {
			credentials = await this.getCredentials('sftp');
		} else {
			credentials = await this.getCredentials('ftp');
		}
		let ftp: ftpClient;
		let sftp: sftpClient;

		try {
			try {
				if (protocol === 'sftp') {
					sftp = new sftpClient();
					if (credentials.privateKey) {
						await sftp.connect({
							host: credentials.host as string,
							port: credentials.port as number,
							username: credentials.username as string,
							password: (credentials.password as string) || undefined,
							privateKey: formatPrivateKey(credentials.privateKey as string),
							passphrase: credentials.passphrase as string | undefined,
						});
					} else {
						await sftp.connect({
							host: credentials.host as string,
							port: credentials.port as number,
							username: credentials.username as string,
							password: credentials.password as string,
						});
					}
				} else {
					ftp = new ftpClient();
					await ftp.connect({
						host: credentials.host as string,
						port: credentials.port as number,
						user: credentials.username as string,
						password: credentials.password as string,
					});
				}
			} catch (error) {
				if (this.continueOnFail()) {
					const pairedItem = generatePairedItemData(items.length);

					return [[{ json: { error: error.message }, pairedItem }]];
				}
				throw error;
			}

			for (let i = 0; i < items.length; i++) {
				try {
					const newItem: INodeExecutionData = {
						json: items[i].json,
						binary: {},
						pairedItem: items[i].pairedItem,
					};

					if (items[i].binary !== undefined && newItem.binary) {
						// Create a shallow copy of the binary data so that the old
						// data references which do not get changed still stay behind
						// but the incoming data does not get changed.
						Object.assign(newItem.binary, items[i].binary);
					}

					items[i] = newItem;

					if (protocol === 'sftp') {
						if (operation === 'list') {
							const path = this.getNodeParameter('path', i) as string;

							const recursive = this.getNodeParameter('recursive', i) as boolean;

							let responseData: sftpClient.FileInfo[];
							if (recursive) {
								responseData = await callRecursiveList(path, sftp!, normalizeSFtpItem);
							} else {
								responseData = await sftp!.list(path);
								responseData.forEach((item) => normalizeSFtpItem(item, path));
							}

							const executionData = this.helpers.constructExecutionMetaData(
								this.helpers.returnJsonArray(responseData as unknown as IDataObject[]),
								{ itemData: { item: i } },
							);
							returnItems = returnItems.concat(executionData);
						}

						if (operation === 'delete') {
							const path = this.getNodeParameter('path', i) as string;
							const options = this.getNodeParameter('options', i);

							if (options.folder === true) {
								await sftp!.rmdir(path, !!options.recursive);
							} else {
								await sftp!.delete(path);
							}
							const executionData = this.helpers.constructExecutionMetaData(
								[{ json: { success: true } }],
								{ itemData: { item: i } },
							);
							returnItems = returnItems.concat(executionData);
						}

						if (operation === 'rename') {
							const oldPath = this.getNodeParameter('oldPath', i) as string;
							const { createDirectories = false } = this.getNodeParameter('options', i) as {
								createDirectories: boolean;
							};
							const newPath = this.getNodeParameter('newPath', i) as string;

							if (createDirectories) {
								await recursivelyCreateSftpDirs(sftp!, newPath);
							}

							await sftp!.rename(oldPath, newPath);
							const executionData = this.helpers.constructExecutionMetaData(
								[{ json: { success: true } }],
								{ itemData: { item: i } },
							);
							returnItems = returnItems.concat(executionData);
						}

						if (operation === 'download') {
							const path = this.getNodeParameter('path', i) as string;
							const binaryFile = await tmpFile({ prefix: 'n8n-sftp-' });
							try {
								await sftp!.get(path, createWriteStream(binaryFile.path));

								const dataPropertyNameDownload = this.getNodeParameter('binaryPropertyName', i);
								const remoteFilePath = this.getNodeParameter('path', i) as string;

								items[i].binary![dataPropertyNameDownload] = await this.nodeHelpers.copyBinaryFile(
									binaryFile.path,
									basename(remoteFilePath),
								);

								const executionData = this.helpers.constructExecutionMetaData(
									this.helpers.returnJsonArray(items[i]),
									{ itemData: { item: i } },
								);
								returnItems = returnItems.concat(executionData);
							} finally {
								await binaryFile.cleanup();
							}
						}

						if (operation === 'upload') {
							const remotePath = this.getNodeParameter('path', i) as string;
							await recursivelyCreateSftpDirs(sftp!, remotePath);

							if (this.getNodeParameter('binaryData', i)) {
								const binaryPropertyName = this.getNodeParameter('binaryPropertyName', i);
								const binaryData = this.helpers.assertBinaryData(i, binaryPropertyName);

								let uploadData: Buffer | Readable;
								if (binaryData.id) {
									uploadData = await this.helpers.getBinaryStream(binaryData.id);
								} else {
									uploadData = Buffer.from(binaryData.data, BINARY_ENCODING);
								}
								await sftp!.put(uploadData, remotePath);
							} else {
								// Is text file
								const buffer = Buffer.from(
									this.getNodeParameter('fileContent', i) as string,
									'utf8',
								);
								await sftp!.put(buffer, remotePath);
							}

							const executionData = this.helpers.constructExecutionMetaData(
								this.helpers.returnJsonArray(items[i]),
								{ itemData: { item: i } },
							);
							returnItems = returnItems.concat(executionData);
						}
					}

					if (protocol === 'ftp') {
						if (operation === 'list') {
							const path = this.getNodeParameter('path', i) as string;

							const recursive = this.getNodeParameter('recursive', i) as boolean;

							let responseData;
							if (recursive) {
								responseData = await callRecursiveList(path, ftp!, normalizeFtpItem);
							} else {
								responseData = await ftp!.list(path);
								responseData.forEach((item) =>
									normalizeFtpItem(item as ftpClient.ListingElement, path),
								);
							}

							const executionData = this.helpers.constructExecutionMetaData(
								this.helpers.returnJsonArray(responseData as unknown as IDataObject[]),
								{ itemData: { item: i } },
							);
							returnItems = returnItems.concat(executionData);
						}

						if (operation === 'delete') {
							const path = this.getNodeParameter('path', i) as string;
							const options = this.getNodeParameter('options', i);

							if (options.folder === true) {
								await ftp!.rmdir(path, !!options.recursive);
							} else {
								await ftp!.delete(path);
							}

							const executionData = this.helpers.constructExecutionMetaData(
								[{ json: { success: true } }],
								{ itemData: { item: i } },
							);
							returnItems = returnItems.concat(executionData);
						}

						if (operation === 'download') {
							const path = this.getNodeParameter('path', i) as string;
							const binaryFile = await tmpFile({ prefix: 'n8n-sftp-' });
							try {
								const stream = await ftp!.get(path);
								await pipeline(stream, createWriteStream(binaryFile.path));

								const dataPropertyNameDownload = this.getNodeParameter('binaryPropertyName', i);
								const remoteFilePath = this.getNodeParameter('path', i) as string;

								items[i].binary![dataPropertyNameDownload] = await this.nodeHelpers.copyBinaryFile(
									binaryFile.path,
									basename(remoteFilePath),
								);

								const executionData = this.helpers.constructExecutionMetaData(
									this.helpers.returnJsonArray(items[i]),
									{ itemData: { item: i } },
								);
								returnItems = returnItems.concat(executionData);
							} finally {
								await binaryFile.cleanup();
							}
						}

						if (operation === 'rename') {
							const oldPath = this.getNodeParameter('oldPath', i) as string;

							const newPath = this.getNodeParameter('newPath', i) as string;

							await ftp!.rename(oldPath, newPath);
							const executionData = this.helpers.constructExecutionMetaData(
								[{ json: { success: true } }],
								{ itemData: { item: i } },
							);
							returnItems = returnItems.concat(executionData);
						}

						if (operation === 'upload') {
							const remotePath = this.getNodeParameter('path', i) as string;
							const fileName = basename(remotePath);
							const dirPath = remotePath.replace(fileName, '');

							if (this.getNodeParameter('binaryData', i)) {
								const binaryPropertyName = this.getNodeParameter('binaryPropertyName', i);
								const binaryData = this.helpers.assertBinaryData(i, binaryPropertyName);

								let uploadData: Buffer | Readable;
								if (binaryData.id) {
									uploadData = await this.helpers.getBinaryStream(binaryData.id);
								} else {
									uploadData = Buffer.from(binaryData.data, BINARY_ENCODING);
								}

								try {
									await ftp!.put(uploadData, remotePath);
								} catch (error) {
									if (error.code === 553) {
										// Create directory
										await ftp!.mkdir(dirPath, true);
										await ftp!.put(uploadData, remotePath);
									} else {
										throw new NodeApiError(this.getNode(), error as JsonObject);
									}
								}
							} else {
								// Is text file
								const buffer = Buffer.from(
									this.getNodeParameter('fileContent', i) as string,
									'utf8',
								);
								try {
									await ftp!.put(buffer, remotePath);
								} catch (error) {
									if (error.code === 553) {
										// Create directory
										await ftp!.mkdir(dirPath, true);
										await ftp!.put(buffer, remotePath);
									} else {
										throw new NodeApiError(this.getNode(), error as JsonObject);
									}
								}
							}
							const executionData = this.helpers.constructExecutionMetaData(
								this.helpers.returnJsonArray(items[i]),
								{ itemData: { item: i } },
							);
							returnItems = returnItems.concat(executionData);
						}
					}
				} catch (error) {
					if (this.continueOnFail()) {
						returnItems.push({ json: { error: error.message }, pairedItem: { item: i } });
						continue;
					}

					throw error;
				}
			}

			if (protocol === 'sftp') {
				await sftp!.end();
			} else {
				await ftp!.end();
			}
		} catch (error) {
			if (protocol === 'sftp') {
				await sftp!.end();
			} else {
				await ftp!.end();
			}
			throw error;
		}

		return [returnItems];
	}
}
