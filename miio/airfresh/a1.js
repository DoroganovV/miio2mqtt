const { Device } = require('../device');

module.exports = class AirFreshA1 extends Device {
	model() {
		return 'Xiaomi Air Fresh A1';
	}

	polling() {
		return 1000;
	}

	init() {
		return Promise.all([
			this.refresh(),

			this.proto.call('miIO.info')
				.then((info) => { this.info = { model: `${this.info.model} (${info.fw_ver})` }; })
				.catch((e) => this.emit('error', e)),
		]);
	}

	properties() {
		return {
			mode: { get: { key: 'mode', readonly: false }, set: { key: 'set_mode', } }, //Auto, Sleep (Eco), Favorite
			favourite_speed: { get: { key: 'favourite_speed', readonly: false }, set: { key: 'set_favourite_speed', } },//150
			control_speed: { get: { key: 'control_speed', readonly: false }, set: { key: 'set_control_speed', } }, //0-150
			//ptc_level: { get: { key: 'ptc_level', }, set: { key: 'set_ptc_level', } }, // Off, Low, Medium, High

			power: {
				get: { key: 'power', parse: (value) => value ? 1 : 0, readonly: false },
				set: { key: 'set_power', parse: (value) => value == 1, }, },
			ptc_on: {
				get: { key: 'ptc_on', parse: (value) => value ? 1 : 0, readonly: false },
				set: { key: 'set_ptc_on', parse: (value) => value == 1, }, },
			display: {
				get: { key: 'display', parse: (value) => value ? 1 : 0, readonly: false },
				set: { key: 'set_display', parse: (value) => value == 1, }, },
			sound: {
				get: { key: 'sound', parse: (value) => value ? 1 : 0, readonly: false },
				set: { key: 'set_sound', parse: (value) => value == 1, }, },

			co2: { get: { key: 'co2', readonly: true }, }, //800
			pm25: { get: { key: 'pm25', readonly: true }, },//0
			temperature_outside: { get: { key: 'temperature_outside', readonly: true }, },//25
			filter_rate: { get: { key: 'filter_rate', readonly: true }, }, //%
			filter_day: { get: { key: 'filter_day', readonly: true }, }, //180 days
		};
	}
};