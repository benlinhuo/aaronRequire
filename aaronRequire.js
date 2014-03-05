
/****************************************************************
*
* 					支持AMD,CMD模块加载方式
*
*****************************************************************/
var require, define;
(function(global) {
	var DOC = global.document,
		W3C = window.dispatchEvent,
		objproto    = Object.prototype,
		objtoString = objproto.toString,
		objhasOwn   = objproto.hasOwnProperty,
		arrproto    = Array.prototype,
		arrsplice   = arrproto.splice,
		modules     = {},
		pushStack   = {};

 	/*****************************************************************
 	*
 	*		 			类型检测
 	*
 	* ****************************************************************/
	function isFunction(it){
		return objtoString.call(it) === '[object Function]';
	}

	function isArray(it) {
		return objtoString.call(it) === '[object Array]';
	}

    function noop() {
    }

    function log(a) {
        window.console && console.log(W3C ? a : a + "")
    }


	//解析依赖关系
	function parseDeps(module) {
		var deps = module['deps'],
			temp = [];
		deps.forEach(function(id, index) {
			temp.push(build(modules[id]))
		})
		return temp;
	}

	function build(module) {
		var depsList,
			factory = module['factory'],
			id = module['id'];

		if (pushStack[id]) { //去重复执行
			return pushStack[id]
		}

		//接口点，将数据或方法定义在其上则将其暴露给外部调用。
		module.exports = {};

		//去重
		delete module.factory;

		if (module['deps']) {
			//依赖数组列表
			depsList = parseDeps(module);
			module.exports = factory.apply(module, depsList);
		} else {
			// exports 支持直接 return 或 modulejs.exports 方式
			module.exports = factory(require, module.exports, module) || module.exports;
		}

		pushStack[id] = module.exports;

		return module.exports;
	}

	//解析require模块
	function makeRequire(ids, callback) {
		var r = ids.length,
			shim = [];

		while (r--) {
			shim.unshift(build(modules[ids[r]]));
		}

		if (callback) {
			callback.apply(null, shim);
		} else {
			shim = null;
		}
	}

	/****************************************************************
	*
	* 						引入模块
	*
	*****************************************************************/
	require = function(id, callback) {

		//数组形式
		//require(['domReady', 'App'], function(domReady, app) {});
		if (isArray(id)) {
			if (id.length > 1) {
				return makeRequire(id, callback);
			}
			id = id[0];
		}

		if (!modules[id]) {
			throw "module " + id + " not found";
		}

		if (callback) {
			var module = build(modules[id]);
			callback(module)
			return module;
		} else {
			if (modules[id].factory) {
				return build(modules[id]);
			}
			return modules[id].exports;
		}
	};

	/****************************************************************
	*
	* 					定义模块
	*
	*****************************************************************/
	define = function(id, deps, factory) { //模块名,依赖列表,模块本身
		if (modules[id]) {
			throw "module " + id + " 模块已存在!";
		}

		//存在依赖导入
		if (arguments.length === 3) {
			modules[id] = {
				id      : id,
				deps    : deps,
				factory : factory
			};
		} else {
			factory = deps;
			modules[id] = {
				id      : id,
				factory : factory
			};
		}
	};

	define.remove = function(id) {
		delete modules[id];
	};


	if (typeof module === "object" && typeof require === "function") {
		module.exports.require = require;
		module.exports.define = define;
	}

})(this);