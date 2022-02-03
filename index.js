const { connect } = require('mqtt');
const { config } = require('./config');
const { Platform } = require('./miio');

const topics = {
	device: (id) => `/devices/miio_${id}`
};

const mqtt = connect(config.mqtt.host, {
	username: config.mqtt.username,
	password: config.mqtt.password,
	clientId: config.mqtt.id});

const miio = new Platform(config.miio);

const format = (type, args) => [`[${type.toUpperCase()}]`, ...args,].join(' ');
const log = (type, ...args) => console.log(format(type, args));
const error = (type, ...args) => console.error(format(type, args));

mqtt.on('connect', () => {
	log('mqtt', `connected to ${config.mqtt.host}`);
	for (key in config.miio) {
		mqtt.subscribe(`${topics.device(key)}/controls/+`);
	}
});

miio.on('device', (device) => {
	log('miio', `${topics.device(device.id)}: ${JSON.stringify(device.info)}`);
	for (key in device.info) {
		mqtt.publish(`${topics.device(device.id)}/controls/${key}`, device.info[key], { retain: true, });
	};
});

miio.on('state', (device) => {
	const state = device.state.get();
	log('miio', `${topics.device(device.id)} state ${JSON.stringify(state)}` );

	for (key in state) {
		mqtt.publish(`${topics.device(device.id)}/controls/${key}`, String(state[key]), { retain: true, });
	};
});

miio.on('status', (device) => {
	const status = device.status.get();
	log('miio', `${topics.device(device.id)} status ${JSON.stringify(status)}` );

	for (key in status) {
		mqtt.publish(`${topics.device(device.id)}/controls/${key}`, String(status[key]), { retain: true, });
	};
});

mqtt.on('message', (topic, data) => {
	const path = topic.split('/');
	const device_id = topic.split('/')[2].replace('miio_','');
	const device = miio.getDeviceById(device_id);
	if (!device) return;
	
	const method = path[path.length - 1];
	if (!device.all_properties[method]) return; 
	if (device.all_properties[method].get && device.all_properties[method].get.readonly) return;
	if (device.all_properties[method].listen && device.all_properties[method].listen.readonly) return;

	try {
		if (device.state.data[method] != data){
			console.log(`${method}: ${device.state.data[method]} => ${data}`);
			device.emit(`set:${method}`, String(data));
		}
	} catch (e) {
		error('mqtt', 'not able to parse incoming message');
		console.log(e);
	}
});

mqtt.on('error', (e) => {
	error('mqtt', 'error');
	error('mqtt', `  > ${e.toString()}`);
});

miio.on('error', (device, e) => {
	error('miio', `device #${device.id} error`);
	error('miio', `  > ${e.toString()}`);
});
