import type { INodeProperties } from 'n8n-workflow';

import * as upload from './upload.operation';
import * as deleteFile from './deleteFile.operation';
import * as list from './list.operation';

export { upload, deleteFile, list };

export const description: INodeProperties[] = [
	{
		displayName: '操作',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		options: [
			{
				name: '删除文件',
				value: 'deleteFile',
				action: '删除文件',
				description: '从服务器上删除文件',
			},
			{
				name: '列出文件',
				value: 'list',
				action: '列出文件',
				description: '返回用户组织中属于的文件列表',
			},
			{
				name: '上传文件',
				value: 'upload',
				action: '上传文件',
				description: '上传可在各种端点中使用的文件',
			},
		],
		default: 'upload',
		displayOptions: {
			show: {
				resource: ['file'],
			},
		},
	},

	...upload.description,
	...deleteFile.description,
	...list.description,
];
