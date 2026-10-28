import type {
	IAuthenticateGeneric,
	Icon,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class ObscurifyApi implements ICredentialType {
	name = 'obscurifyApi';

	displayName = 'Obscurify.ai API';

	icon: Icon = { light: 'file:obscurify.svg', dark: 'file:obscurify.dark.svg' };

	documentationUrl = 'https://github.com/Obscurify-ai/n8n-nodes-obscurify#credentials';

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			required: true,
			default: '',
			placeholder: 'sk-obs1_...',
			description: 'Your Obscurify.ai API key. Click Show API Key on https://obscurify.ai/account.',
		},
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			default: 'https://obscurify.ai/v1',
			description:
				'The OpenAI-compatible API root. Leave the default unless you reach Obscurify.ai through a proxy or the Tor onion address.',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.apiKey}}',
			},
		},
	};

	// The model list is public, so the key is checked against the account balance endpoint.
	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.baseUrl.replace(/\\/v1\\/?$/, "")}}',
			url: '/get_user_balance',
			method: 'GET',
		},
	};
}
