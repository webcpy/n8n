import type { INodeTypeBaseDescription, IVersionedNodeType } from 'n8n-workflow';
import { VersionedNodeType } from 'n8n-workflow';

import { MergeV1 } from './v1/MergeV1.node';
import { MergeV2 } from './v2/MergeV2.node';

export class Merge extends VersionedNodeType {
	constructor() {
		const baseDescription: INodeTypeBaseDescription = {
			displayName: 'Merge',
			name: 'merge',
			icon: 'file:merge.svg',
			group: ['transform'],
			subtitle: '={{$parameter["mode"]}}',
			description: '一旦有了多个数据流的数据，就可合并这两个数据流的数据',
			defaultVersion: 2.1,
		};

		const nodeVersions: IVersionedNodeType['nodeVersions'] = {
			1: new MergeV1(baseDescription),
			2: new MergeV2(baseDescription),
			2.1: new MergeV2(baseDescription),
		};

		super(nodeVersions, baseDescription);
	}
}
