import type { INodeProperties } from 'n8n-workflow';

export const zoneCertificateOperations: INodeProperties[] = [
	{
		displayName: '操作',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['zoneCertificate'],
			},
		},
		"options": [
			{
				"name": "删除",
				"value": "delete",
				"description": "删除证书",
				"action": "删除证书"
			},
			{
				"name": "获取",
				"value": "get",
				"description": "获取证书",
				"action": "获取证书"
			},
			{
				"name": "获取多个",
				"value": "getMany",
				"description": "获取多个证书",
				"action": "获取多个证书"
			},
			{
				"name": "上传",
				"value": "upload",
				"description": "上传证书",
				"action": "上传证书"
			}
		],
		default: 'upload',
	},
];

export const zoneCertificateFields: INodeProperties[] = [
	/* -------------------------------------------------------------------------- */
	/*                          certificate:upload                                */
	/* -------------------------------------------------------------------------- */
	{
		"displayName": "区域名称或ID",
		"name": "zoneId",
		"type": "options",
		"description": "从列表中选择，或使用表达式指定ID",
		"typeOptions": {
			"loadOptionsMethod": "getZones"
		},
		"required": true,
		"displayOptions": {
			"show": {
				"resource": ["zoneCertificate"],
				"operation": ["upload", "getMany", "get", "delete"]
			}
		},
		"default": ""
	},
	{
		"displayName": "证书内容",
		"name": "certificate",
		"type": "string",
		"required": true,
		"displayOptions": {
			"show": {
				"resource": ["zoneCertificate"],
				"operation": ["upload"]
			}
		},
		"default": "",
		"description": "区域的Leaf证书"
	},
	{
		"displayName": "私钥",
		"name": "privateKey",
		"type": "string",
		"required": true,
		"displayOptions": {
			"show": {
				"resource": ["zoneCertificate"],
				"operation": ["upload"]
			}
		},
		"default": ""
	},
	/* -------------------------------------------------------------------------- */
	/*                          certificate:getMany                               */
	/* -------------------------------------------------------------------------- */
	{
		"displayName": "返回所有",
		"name": "returnAll",
		"type": "boolean",
		"description": "是否返回所有结果或仅返回给定限制内的结果",
		"default": false,
		"displayOptions": {
			"show": {
				"resource": ["zoneCertificate"],
				"operation": ["getMany"]
			}
		}
	},
	{
		"displayName": "限制",
		"name": "limit",
		"type": "number",
		"default": 25,
		"typeOptions": {
			"minValue": 1,
			"maxValue": 50
		},
		"displayOptions": {
			"show": {
				"resource": ["zoneCertificate"],
				"operation": ["getMany"],
				"returnAll": [false]
			}
		},
		"description": "要返回的结果的最大数量"
	},
	{
		"displayName": "过滤器",
		"name": "filters",
		"type": "collection",
		"placeholder": "添加字段",
		"default": {},
		"displayOptions": {
			"show": {
				"resource": ["zoneCertificate"],
				"operation": ["getMany"]
			}
		},
		"options": [
			{
				"displayName": "状态",
				"name": "status",
				"type": "options",
				"options": [
					{
						"name": "激活",
						"value": "active"
					},
					{
						"name": "过期",
						"value": "expired"
					},
					{
						"name": "已删除",
						"value": "deleted"
					},
					{
						"name": "待处理",
						"value": "pending"
					}
				],
				"default": "",
				"description": "区域的自定义SSL状态"
			}
		]
	},
	/* -------------------------------------------------------------------------- */
	/*                          certificate:get                                   */
	/* -------------------------------------------------------------------------- */
	{
		"displayName": "证书ID",
		"name": "certificateId",
		"type": "string",
		"required": true,
		"displayOptions": {
			"show": {
				"resource": ["zoneCertificate"],
				"operation": ["get", "delete"]
			}
		},
		"default": ""
	}
];
