/**
 * Created by Chamberlain on 8/29/2018.
 */

module.exports = class PluginConsole {
	init() {
		this.routes = {
			'use::/console':
				[$$$.paths._bpa.src + '/console',
				404
			]
		};
	}

	configure() {

	}
}