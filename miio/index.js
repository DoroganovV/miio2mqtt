const miio = require('miio');
const { EventEmitter } = require('events');
const { Device } = require('./device');

const models = require('./models');

class Platform extends EventEmitter {

	constructor(tokens) {
		super();

		this.devices = {};
		this.tokens = tokens;

		const devices = miio.devices({ cacheTime: 300 });

		devices.on('available', (data) => {
			console.log(`Found ${data.id} (${data.hostname} - ${data.address})`);
			this.initDevice(data);
		});

		devices.on('unavailable', (data) => {
			const device = this.getDeviceById(data.id);
			if (!device) return;
			device.set({ online: 0 });
		});
	}

	getTokenById(id) {
		return this.tokens[id];
	}

	getDeviceById(id) {
		return this.devices[id];
	}

	initDevice(info) {
		let device = this.getDeviceById(info.id);

		if (device) return device;

		return miio.device({ address: info.address, token: this.getTokenById(info.id) })
			.then((data) => {
				device = models[data.miioModel]
					? new models[data.miioModel](this, data, info)
					: new Device(this, data, info);

				this.devices[info.id] = device;

				device.on('error', (error) => {
					this.emit('error', device, error);
				});

				device.init().then(() => {
					this.emit('device', device);

					this.emit('state', device);
					this.emit('status', device);

					device.on('state', () => this.emit('state', device));
					device.on('status', () => this.emit('status', device));
				});

				return device;
			})
			.catch((e) => this.emit('error', info, e));
	}

}

module.exports = { Platform };
