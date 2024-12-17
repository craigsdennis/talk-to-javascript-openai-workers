const hand = new Hand();

function talkToTheHand() {
	hand
		.connect()
		.then(() => console.log('Hand is ready'))
		.catch((err) => console.error(err));
}

const fns = {
	getPageHTML: () => {
		return { success: true, html: document.documentElement.outerHTML };
	},
	changeBackgroundColor: ({ color }) => {
		document.body.style.backgroundColor = color;
		return { success: true, color };
	},
	changeTextColor: ({ color }) => {
		document.body.style.color = color;
		return { success: true, color };
	},
	showFingers: async ({ numberOfFingers }) => {
		await hand.sendCommand(numberOfFingers);
		return { success: true, numberOfFingers };
	},
	generateImage: async ({ prompt }) => {
		console.log('generateImage', prompt);
		const imageUrl = await fetch('/generate-image', {
			method: 'POST',
			body: prompt,
		}).then((r) => r.text());

		console.log('imageUrl', imageUrl);
		
		// append the image to the page
		const img = document.createElement('img');
		img.src = imageUrl;
		img.style.maxWidth = '100%';
		const container = document.getElementById('image-container');
		container.prepend(img);

		return { success: true, imageUrl };
	}
};

// Create a WebRTC Agent
const peerConnection = new RTCPeerConnection();

// On inbound audio add to page
peerConnection.ontrack = (event) => {
	const el = document.createElement('audio');
	el.srcObject = event.streams[0];
	el.autoplay = el.controls = true;
	document.body.appendChild(el);
};

const dataChannel = peerConnection.createDataChannel('response');

function configureData() {
	console.log('Configuring data channel');
	const event = {
		type: 'session.update',
		session: {
			modalities: ['text', 'audio'],
			// Provide the tools. Note they match the keys in the `fns` object above
			tools: [
				{
					type: 'function',
					name: 'changeBackgroundColor',
					description: 'Changes the background color of a web page',
					parameters: {
						type: 'object',
						properties: {
							color: { type: 'string', description: 'A hex value of the color' },
						},
					},
				},
				{
					type: 'function',
					name: 'changeTextColor',
					description: 'Changes the text color of a web page',
					parameters: {
						type: 'object',
						properties: {
							color: { type: 'string', description: 'A hex value of the color' },
						},
					},
				},
				{
					type: 'function',
					name: 'showFingers',
					description: 'Controls a robot hand to show a specific number of fingers',
					parameters: {
						type: 'object',
						properties: {
							numberOfFingers: { type: 'string', description: 'Values 1 through 5 of the number of fingers to hold up' },
						},
					},
				},
				{
					type: 'function',
					name: 'getPageHTML',
					description: 'Gets the HTML for the current page',
				},
				{
					type: 'function',
					name: 'generateImage',
					description: 'Generates an image using AI and displays it on the page',
					parameters: {
						type: 'object',
						properties: {
							prompt: { type: 'string', description: 'Text description of the image to generate' }
						}
					}
				}
			],
		},
	};
	dataChannel.send(JSON.stringify(event));
}

dataChannel.addEventListener('open', (ev) => {
	console.log('Opening data channel', ev);
	configureData();
});

// {
//     "type": "response.function_call_arguments.done",
//     "event_id": "event_Ad2gt864G595umbCs2aF9",
//     "response_id": "resp_Ad2griUWUjsyeLyAVtTtt",
//     "item_id": "item_Ad2gsxA84w9GgEvFwW1Ex",
//     "output_index": 1,
//     "call_id": "call_PG12S5ER7l7HrvZz",
//     "name": "get_weather",
//     "arguments": "{\"location\":\"Portland, Oregon\"}"
// }

dataChannel.addEventListener('message', async (ev) => {
	const msg = JSON.parse(ev.data);
	// Handle function calls
	if (msg.type === 'response.function_call_arguments.done') {
		const fn = fns[msg.name];
		if (fn !== undefined) {
			console.log(`Calling local function ${msg.name} with ${msg.arguments}`);
			const args = JSON.parse(msg.arguments);
			const result = await fn(args);
			console.log('result', result);
			// Let OpenAI know that the function has been called and share it's output
			const event = {
				type: 'conversation.item.create',
				item: {
					type: 'function_call_output',
					call_id: msg.call_id, // call_id from the function_call message
					output: JSON.stringify(result), // result of the function
				},
			};
			dataChannel.send(JSON.stringify(event));
		}
	}
});

// Capture microphone
navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
	// Add microphone to PeerConnection
	stream.getTracks().forEach((track) => peerConnection.addTransceiver(track, { direction: 'sendrecv' }));

	peerConnection.createOffer().then((offer) => {
		peerConnection.setLocalDescription(offer);

		// Send WebRTC Offer to Workers Realtime WebRTC API Relay
		fetch('/rtc-connect', {
			method: 'POST',
			body: offer.sdp,
			headers: {
				'Content-Type': 'application/sdp',
			},
		})
			.then((r) => r.text())
			.then((answer) => {
				// Accept answer from Realtime WebRTC API
				peerConnection.setRemoteDescription({
					sdp: answer,
					type: 'answer',
				});
			});
	});
});
