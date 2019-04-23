/**
 * Created by Chamberlain on 8/15/2018.
 */

let _this;
const fs = require( 'fs-extra' );
const log = o => {
	if ( _this.isSilent ) return;
	trace( o );
};

module.exports = class PluginManager {
	constructor() {
		this._modules = [];
		this._moduleDirs = [];
		this.isSilent = false;

		_this = this;
	}

	errHandler(err) {
		if ( err === 'done' ) return trace( "Done.".green );
		if ( err === 'skip' ) return;

		trace.FAIL( "An error occured!".red );
		trace( err );
	}

	loadFromPath( paths, params ) {
		if ( !_.isArray( paths ) ) paths = [paths];

		const toPromise = path => {
			if ( !fs.existsSync( path ) ) {
				throw ( 'Cannot add non-existant plugins directory: ' + path );
			}

			if ( _this._moduleDirs.has( path ) ) {
				//trace( "Already loaded plugin path: " + path );
				return;
			}

			_this._moduleDirs.push( path );

			return $$$
				.requireDir( path, _.extend( { filter: 'plugin*' }, params ) )
				.then( modules => {
					modules.forEach( pluginCls => {
						const name = pluginCls.name.remove( 'Plugin' );

						if ( _this[name] ) {
							trace.FAIL( "Already loaded plugin named: ".red + name );
							return;
						}

						log( pluginCls.name + " Loaded." );

						const inst = new pluginCls();
						inst.name = name;

						_this._modules.push( inst );
						_this[name] = inst;
					} );
				} )
		};

		return Promise.each( paths, toPromise )
			.then( () => _this );
	}

	callEach(methodName, ... args) {
		return this.forEach(methodName, (func, plugin) => {
			return func.apply(plugin, args);
		} ).then( () => this );
	}

	forEach(methodName, cb) {
		let m = 0;
		const failed = [];
		const mods = this._modules;

		log("Start calling: ".green + methodName);

		function nextCall() {
			if(m>=mods.length) return onDone();

			const plugin = mods[m++];
			const func = plugin[methodName];

			if(!func) {
				failed.push(plugin.name);
				return nextCall();
			}

			const result = cb(func, plugin);

			log(`${plugin.name}.${methodName} = ${result}`.cyan);

			return Promise.resolve(result).then(nextCall);
		}

		function onDone() {
			if(failed.length) {
				log( `Failed calling "${methodName}" on:\n`.red + failed.toPrettyList() )
			} else {
				log( " ... Done calling: ".yellow + methodName );
			}

			return _this;
		}

		return nextCall();
	}
}

