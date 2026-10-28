import type {
	IDataObject,
	IExecuteFunctions,
	IHttpRequestMethods,
	ILoadOptionsFunctions,
	INodeExecutionData,
	INodePropertyOptions,
	INodeType,
	INodeTypeDescription,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError, NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

const DEFAULT_BASE_URL = 'https://obscurify.ai/v1';

type ModelEntry = {
	id: string;
	name?: string;
	context_length?: number;
	tools?: boolean;
	decisions?: boolean;
	pricing?: { prompt?: number; completion?: number };
};

async function obscurifyRequest(
	this: IExecuteFunctions | ILoadOptionsFunctions,
	method: IHttpRequestMethods,
	path: string,
	body?: IDataObject,
	itemIndex = 0,
): Promise<IDataObject> {
	const credentials = await this.getCredentials('obscurifyApi');
	const baseUrl = ((credentials.baseUrl as string) || DEFAULT_BASE_URL).replace(/\/+$/, '');
	// Account endpoints live at the site root, the OpenAI-compatible ones under /v1.
	const url = path.startsWith('/v1/')
		? `${baseUrl}${path.slice(3)}`
		: `${baseUrl.replace(/\/v1$/, '')}${path}`;
	try {
		return (await this.helpers.httpRequestWithAuthentication.call(this, 'obscurifyApi', {
			method,
			url,
			body,
			json: true,
		})) as IDataObject;
	} catch (error) {
		throw new NodeApiError(this.getNode(), error as JsonObject, { itemIndex });
	}
}

export class Obscurify implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Obscurify.ai',
		name: 'obscurify',
		icon: { light: 'file:obscurify.svg', dark: 'file:obscurify.dark.svg' },
		group: ['transform'],
		version: [1],
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Chat with 200+ AI models through the private, OpenAI-compatible Obscurify.ai API',
		defaults: {
			name: 'Obscurify.ai',
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		usableAsTool: true,
		credentials: [
			{
				name: 'obscurifyApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Account', value: 'account' },
					{ name: 'Chat', value: 'chat' },
					{ name: 'Model', value: 'model' },
				],
				default: 'chat',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['chat'] } },
				options: [
					{
						name: 'Message a Model',
						value: 'message',
						action: 'Message a model',
						description: 'Send messages to a model and get its reply',
					},
				],
				default: 'message',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['model'] } },
				options: [
					{
						name: 'Get Many',
						value: 'getAll',
						action: 'Get many models',
						description: 'List the available models with context windows and prices',
					},
				],
				default: 'getAll',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['account'] } },
				options: [
					{
						name: 'Get Balance',
						value: 'getBalance',
						action: 'Get the account balance',
						description: 'Get the balance of the account the API key belongs to, in USD',
					},
				],
				default: 'getBalance',
			},
			{
				displayName: 'Model Name or ID',
				name: 'model',
				type: 'options',
				typeOptions: { loadOptionsMethod: 'getModels' },
				required: true,
				default: 'deepseek/deepseek-v4-flash',
				description:
					'The model to use. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
				displayOptions: { show: { resource: ['chat'], operation: ['message'] } },
			},
			{
				displayName: 'Messages',
				name: 'messages',
				type: 'fixedCollection',
				typeOptions: { multipleValues: true, sortable: true },
				placeholder: 'Add Message',
				default: { values: [{ role: 'user', content: '' }] },
				displayOptions: { show: { resource: ['chat'], operation: ['message'] } },
				options: [
					{
						displayName: 'Message',
						name: 'values',
						values: [
							{
								displayName: 'Role',
								name: 'role',
								type: 'options',
								options: [
									{ name: 'Assistant', value: 'assistant' },
									{ name: 'System', value: 'system' },
									{ name: 'User', value: 'user' },
								],
								default: 'user',
								description: 'Who wrote the message',
							},
							{
								displayName: 'Content',
								name: 'content',
								type: 'string',
								typeOptions: { rows: 4 },
								default: '',
								description: 'The text of the message',
							},
						],
					},
				],
			},
			{
				displayName: 'Simplify Output',
				name: 'simplify',
				type: 'boolean',
				default: true,
				description:
					'Whether to return only the reply text, reasoning, model and token usage instead of the full API response',
				displayOptions: { show: { resource: ['chat'], operation: ['message'] } },
			},
			{
				displayName: 'Options',
				name: 'options',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				displayOptions: { show: { resource: ['chat'], operation: ['message'] } },
				options: [
					{
						displayName: 'JSON Output',
						name: 'jsonOutput',
						type: 'boolean',
						default: false,
						description:
							'Whether to ask the model for a JSON object (response_format json_object). Mention JSON in your prompt too.',
					},
					{
						displayName: 'Maximum Tokens',
						name: 'maxTokens',
						type: 'number',
						typeOptions: { minValue: 1 },
						default: 1024,
						description: 'The most tokens the reply may use',
					},
					{
						displayName: 'Reasoning Effort',
						name: 'reasoningEffort',
						type: 'options',
						options: [
							{ name: 'Extra High', value: 'xhigh' },
							{ name: 'High', value: 'high' },
							{ name: 'Low', value: 'low' },
							{ name: 'Max', value: 'max' },
							{ name: 'Medium', value: 'medium' },
							{ name: 'Minimal', value: 'minimal' },
							{ name: 'None', value: 'none' },
						],
						default: 'medium',
						description:
							'How much the model thinks before answering. Models that do not reason ignore this.',
					},
					{
						displayName: 'Temperature',
						name: 'temperature',
						type: 'number',
						typeOptions: { minValue: 0, maxValue: 2, numberPrecision: 2 },
						default: 1,
						description: 'Higher values make the reply more random, lower values more focused',
					},
					{
						displayName: 'Top P',
						name: 'topP',
						type: 'number',
						typeOptions: { minValue: 0, maxValue: 1, numberPrecision: 2 },
						default: 1,
						description: 'Nucleus sampling: only consider tokens within this probability mass',
					},
				],
			},
			{
				displayName: 'Chat Models Only',
				name: 'chatOnly',
				type: 'boolean',
				default: true,
				description:
					'Whether to leave out decision models, which answer structured questions instead of chatting',
				displayOptions: { show: { resource: ['model'], operation: ['getAll'] } },
			},
		],
	};

	methods = {
		loadOptions: {
			async getModels(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const response = await obscurifyRequest.call(this, 'GET', '/v1/models');
				const models = (response.data as ModelEntry[]) ?? [];
				return models
					.filter((model) => !model.decisions)
					.map((model) => ({
						name: model.name ? `${model.name} (${model.id})` : model.id,
						value: model.id,
						description: model.context_length
							? `${Math.round(model.context_length / 1000)}K context${model.tools ? ', tools' : ''}`
							: undefined,
					}))
					.sort((a, b) => a.name.localeCompare(b.name));
			},
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				if (resource === 'chat' && operation === 'message') {
					const model = this.getNodeParameter('model', itemIndex) as string;
					const messageValues = this.getNodeParameter('messages.values', itemIndex, []) as Array<{
						role: string;
						content: string;
					}>;
					const messages = messageValues.filter((message) => message.content !== '');
					if (messages.length === 0) {
						throw new NodeOperationError(this.getNode(), 'Add at least one message with content', {
							itemIndex,
						});
					}
					const simplify = this.getNodeParameter('simplify', itemIndex, true) as boolean;
					const options = this.getNodeParameter('options', itemIndex, {}) as IDataObject;

					const body: IDataObject = { model, messages };
					if (options.maxTokens !== undefined) body.max_tokens = options.maxTokens;
					if (options.temperature !== undefined) body.temperature = options.temperature;
					if (options.topP !== undefined) body.top_p = options.topP;
					if (options.reasoningEffort !== undefined)
						body.reasoning_effort = options.reasoningEffort;
					if (options.jsonOutput) body.response_format = { type: 'json_object' };

					const response = await obscurifyRequest.call(
						this,
						'POST',
						'/v1/chat/completions',
						body,
						itemIndex,
					);
					if (simplify) {
						const choice = ((response.choices as IDataObject[]) ?? [])[0] ?? {};
						const message = (choice.message as IDataObject) ?? {};
						returnData.push({
							json: {
								content: message.content ?? '',
								...(message.reasoning ? { reasoning: message.reasoning } : {}),
								finish_reason: choice.finish_reason,
								model: response.model,
								usage: response.usage,
							},
							pairedItem: { item: itemIndex },
						});
					} else {
						returnData.push({ json: response, pairedItem: { item: itemIndex } });
					}
				} else if (resource === 'model' && operation === 'getAll') {
					const chatOnly = this.getNodeParameter('chatOnly', itemIndex, true) as boolean;
					const response = await obscurifyRequest.call(
						this,
						'GET',
						'/v1/models',
						undefined,
						itemIndex,
					);
					const models = ((response.data as ModelEntry[]) ?? []).filter(
						(model) => !chatOnly || !model.decisions,
					);
					for (const model of models) {
						returnData.push({
							json: model as unknown as IDataObject,
							pairedItem: { item: itemIndex },
						});
					}
				} else if (resource === 'account' && operation === 'getBalance') {
					const response = await obscurifyRequest.call(
						this,
						'GET',
						'/get_user_balance',
						undefined,
						itemIndex,
					);
					returnData.push({ json: response, pairedItem: { item: itemIndex } });
				} else {
					throw new NodeOperationError(
						this.getNode(),
						`The operation "${operation}" is not supported for "${resource}"`,
						{ itemIndex },
					);
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: { error: (error as Error).message },
						pairedItem: { item: itemIndex },
					});
					continue;
				}
				// Requests already throw NodeApiError (with the HTTP details); wrap anything else.
				const nodeError =
					error instanceof NodeApiError || error instanceof NodeOperationError
						? error
						: new NodeOperationError(this.getNode(), error as Error, { itemIndex });
				throw nodeError;
			}
		}

		return [returnData];
	}
}
