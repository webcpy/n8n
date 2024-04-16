import type { INodeTypeBaseDescription, IVersionedNodeType } from 'n8n-workflow';
import { VersionedNodeType } from 'n8n-workflow';

import { MySqlV1 } from './v1/MySqlV1.node';
import { MySqlV2 } from './v2/MySqlV2.node';

export class MySql extends VersionedNodeType {
	constructor() {
		const baseDescription: INodeTypeBaseDescription = {
			displayName: 'MySQL',
			name: 'mySql',
			icon: 'file:mysql.svg',
			group: ['input'],
			defaultVersion: 2.3,
			description: '在 MySQL 中获取、添加和更新数据',
			parameterPane: 'wide',
		};

		const nodeVersions: IVersionedNodeType['nodeVersions'] = {
			1: new MySqlV1(baseDescription),
			2: new MySqlV2(baseDescription),
			2.1: new MySqlV2(baseDescription),
			2.2: new MySqlV2(baseDescription),
			2.3: new MySqlV2(baseDescription),
		};

		super(nodeVersions, baseDescription);
	}
}
